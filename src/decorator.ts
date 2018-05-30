import "reflect-metadata";

export const GQ_QUERY_KEY = Symbol("gq_query");
export const GQ_MUTATION_KEY = Symbol("gq_mutation");
export const GQ_DESCRIPTION_KEY = Symbol("gq_description");
export const GQ_SUBSCRIPTION_KEY = Symbol("gq_subscription");
export const GQ_FIELDS_KEY = Symbol("gq_fields");
export const GQ_OBJECT_METADATA_KEY = Symbol("gq_object_type");
export const GQ_SCHEMA_KEY = Symbol("gq_schema");
export const GQ_MERGE_QUERY_KEY = Symbol("gq_merge");
export const GQ_ENUM_KEY = Symbol("gq_enum");
export const GQ_ENUM_VALUE_KEY = Symbol("gq_enum_value");

export interface MergeOptionMetadata {
    merge: any[];
}

export interface TypeMetadata {
    name?: string;
    description?: string;
    isNonNull?: boolean;
    isList?: boolean;
    multidimensionalList?: number;
    explicitType?: any;
}

export interface ArgumentMetadata extends TypeMetadata {
}

export interface FieldTypeMetadata extends ArgumentMetadata {
    args?: ArgumentMetadata[];
    parent?: ParentMetadata;
    context?: ContextMetadata;
    isConnection?: boolean;
}

export interface ContextMetadata extends ArgumentMetadata {
    index?: number;
}

export interface ParentMetadata extends ContextMetadata {
}

export interface DescriptionMetadata {
    name?: string;
    description?: string;
}

export interface EnumTypeMetadata {
    name?: string;
    description?: string;
    values?: EnumValueMetadata[];
}

export interface EnumValueMetadata {
    name: string;
    value?: any;
    description?: string;
}

export interface ObjectTypeMetadata {
    name?: string;
    description?: string;
    isInput?: boolean;
    merge?: any[];
}

function createOrSetObjectTypeMetadata(target: any, metadata: ObjectTypeMetadata) {
    if (!Reflect.hasMetadata(GQ_OBJECT_METADATA_KEY, target.prototype)) {
        Reflect.defineMetadata(GQ_OBJECT_METADATA_KEY, metadata, target.prototype);
    } else {
        const originalMetadata = Reflect.getMetadata(GQ_OBJECT_METADATA_KEY, target.prototype) as ObjectTypeMetadata;
        Object.assign(originalMetadata, metadata);
    }
}

export interface FieldOption {
    type?: any;
    isConnection?: boolean;
}

export interface ArgumentOption {
    name: string;
    type?: any;
}

function createOrSetFieldTypeMetadata(target: any, metadata: FieldTypeMetadata) {
    let fieldDefs: FieldTypeMetadata[];
    if (!Reflect.hasMetadata(GQ_FIELDS_KEY, target)) {
        fieldDefs = [];
        Reflect.defineMetadata(GQ_FIELDS_KEY, fieldDefs, target);
    } else {
        fieldDefs = Reflect.getMetadata(GQ_FIELDS_KEY, target);
    }
    const def = fieldDefs.find((d) => d.name === metadata.name);
    if (!def) {
        fieldDefs.push(metadata);
    } else {
        let args: ArgumentMetadata[] = def.args;
        if (metadata.args && metadata.args.length) {
            if (!def.args) {
                args = metadata.args;
            } else {
                args = Object.assign([], def.args, metadata.args);
            }
        }
        Object.assign(def, metadata);
        def.args = args;
    }
}

export function getFieldMetadata(target: any, name: string) {
    if (!Reflect.hasMetadata(GQ_FIELDS_KEY, target)) {
        return null;
    }
    return (Reflect.getMetadata(GQ_FIELDS_KEY, target) as FieldTypeMetadata[]).find((m) => m.name === name);
}

function setArgumentMetadata(target: any, propertyKey: any, index: number, metadata: ArgumentMetadata) {
    const fieldMetadata = getFieldMetadata(target, propertyKey);
    if (fieldMetadata && fieldMetadata.args && fieldMetadata.args[index]) {
        Object.assign(fieldMetadata.args[index], metadata);
    } else {
        const args: ArgumentMetadata[] = [];
        args[index] = metadata;
        createOrSetFieldTypeMetadata(target, {
            name: propertyKey,
            args,
        });
    }
}

function setParentMetadata(target: any, propertyKey: any, index: number, metadata: ContextMetadata) {
    const fieldMetadata = getFieldMetadata(target, propertyKey);
    if (fieldMetadata && fieldMetadata.parent) {
        Object.assign(fieldMetadata.parent, metadata);
    } else {
        createOrSetFieldTypeMetadata(target, {
            name: propertyKey,
            parent: {index},
        });
    }
}

function setContextMetadata(target: any, propertyKey: any, index: number, metadata: ContextMetadata) {
    const fieldMetadata = getFieldMetadata(target, propertyKey);
    if (fieldMetadata && fieldMetadata.context) {
        Object.assign(fieldMetadata.context, metadata);
    } else {
        createOrSetFieldTypeMetadata(target, {
            name: propertyKey,
            context: {index},
        });
    }
}

function createOrSetDescriptionMetadata(target: any, metadata: DescriptionMetadata) {

    if (!Reflect.hasMetadata(GQ_DESCRIPTION_KEY, target)) {
        Reflect.defineMetadata(GQ_DESCRIPTION_KEY, [metadata], target);
    } else {
        const enumValues = Reflect.getMetadata(GQ_DESCRIPTION_KEY, target) as DescriptionMetadata[];
        if (Array.isArray(enumValues) && metadata && enumValues.every((enumValue) => enumValue.name !== metadata.name)) {
            enumValues.push(metadata);
        }
    }
}

function createOrSetEnumMetadata(target: any, metadata: EnumTypeMetadata) {
    if (!Reflect.hasMetadata(GQ_ENUM_KEY, target.prototype)) {
        Reflect.defineMetadata(GQ_ENUM_KEY, metadata, target.prototype);
    } else {
        const originalMetadata = Reflect.getMetadata(GQ_ENUM_KEY, target.prototype) as EnumTypeMetadata;
        Object.assign(originalMetadata, metadata);
    }
}

function createOrSetEnumValueTypeMetadata(target: any, metadata: EnumValueMetadata) {
    let valueDefs: EnumValueMetadata[];
    if (!Reflect.hasMetadata(GQ_ENUM_VALUE_KEY, target)) {
        valueDefs = [];
        Reflect.defineMetadata(GQ_ENUM_VALUE_KEY, valueDefs, target);
    } else {
        valueDefs = Reflect.getMetadata(GQ_ENUM_VALUE_KEY, target);
    }
    const def = valueDefs.find((d) => d.name === metadata.name);
    if (!def) {
        valueDefs.push(metadata);
    } else {
        Object.assign(def, metadata);
    }
}

export function ObjectType(option?: MergeOptionMetadata) {
    return (target: any) => {
        createOrSetObjectTypeMetadata(target, {
            name: target.name,
            isInput: false,
            ...option,
        });
    };
}

export function InputObjectType(option?: MergeOptionMetadata) {
    return (target: any) => {
        createOrSetObjectTypeMetadata(target, {
            name: target.name,
            isInput: true,
            ...option,
        });
    };
}

export function Field(option?: FieldOption) {
    return (target: any, propertyKey: any) => {

        const metadata = {
            name: propertyKey,
            explicitType: option && option.type,
            isConnection: option && option.isConnection,
        } as FieldTypeMetadata;

        createOrSetFieldTypeMetadata(target, metadata);
    };
}

export function NonNull() {
    return (target: any, propertyKey: any, index?: any) => {
        if (index >= 0 && typeof index === "number") {
            setArgumentMetadata(target, propertyKey, index, {
                isNonNull: true,
            });
        } else {
            createOrSetFieldTypeMetadata(target, {
                name: propertyKey,
                isNonNull: true,
            });
        }
    };
}

export function List(multidimensionalList: number = 1) {
    return (target: any, propertyKey: any, index?: any) => {
        if (index >= 0 && typeof index === "number") {
            setArgumentMetadata(target, propertyKey, index, {
                isList: true,
                multidimensionalList,
            });
        } else {
            createOrSetFieldTypeMetadata(target, {
                name: propertyKey,
                isList: true,
                multidimensionalList,
            });
        }
    };
}

export function Enum() {
    return (target: any) => {
        createOrSetEnumMetadata(target, {
            name: target.name,
        });
    };
}

export function EnumValue(value?: any) {
    return (target: any, propertyKey: any) => {
        createOrSetEnumValueTypeMetadata(target, {
            name: propertyKey,
            value,
        });
    };
}

export function Arg(option: ArgumentOption) {
    return (target: any, propertyKey: any, index: number) => {
        setArgumentMetadata(target, propertyKey, index, {
            name: option.name,
            explicitType: option.type,
        });
    };
}

export function Parent() {
    return (target: any, propertyKey: any, index: number) => {
        setParentMetadata(target, propertyKey, index, {});
    };
}

export function Ctx() {
    return (target: any, propertyKey: any, index: number) => {
        setContextMetadata(target, propertyKey, index, {});
    };
}

export function Description(body: string) {
    return (target: any, propertyKey?: any, index?: any): any => {
        if (index >= 0 && typeof index === "number") {
            setArgumentMetadata(target, propertyKey, index, {
                description: body,
            });
        } else if (propertyKey) {
            createOrSetDescriptionMetadata(target, {
                name: propertyKey,
                description: body,
            });
        } else {
            createOrSetObjectTypeMetadata(target, {
                description: body,
            });
        }
    };
}

export function Query() {
    return (target: any, propertyKey: any) => {
        Reflect.defineMetadata(GQ_QUERY_KEY, propertyKey, target);
    };
}

export function Mutation() {
    return (target: any, propertyKey: any) => {
        Reflect.defineMetadata(GQ_MUTATION_KEY, propertyKey, target);
    };
}

export function Subscription() {
    return (target: any, propertyKey: any) => {
        Reflect.defineMetadata(GQ_SUBSCRIPTION_KEY, propertyKey, target);
    };
}

export function Schema() {
    return (target: any) => {
        Reflect.defineMetadata(GQ_SCHEMA_KEY, {}, target);
    };
}
