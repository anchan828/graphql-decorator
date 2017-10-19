import "reflect-metadata";

export const GQ_QUERY_KEY = Symbol("gq_query");
export const GQ_MUTATION_KEY = Symbol("gq_mutation");
export const GQ_FIELDS_KEY = Symbol("gq_fields");
export const GQ_OBJECT_METADATA_KEY = Symbol("gq_object_type");
export const GQ_SCHEMA_KEY = Symbol("gq_schema");

export interface TypeMetadata {
    name?: string;
    description?: string;
    isNonNull?: boolean;
    isList?: boolean;
    explicitType?: any;
}

export interface ArgumentMetadata extends TypeMetadata {
}

export interface FieldTypeMetadata extends ArgumentMetadata {
    args?: ArgumentMetadata[];
}

export interface ObjectTypeMetadata {
    name?: string;
    description?: string;
    isInput?: boolean;
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

export function ObjectType() {
    return (target: any) => {
        createOrSetObjectTypeMetadata(target, {
            name: target.name,
            isInput: false,
        });
    };
}

export function InputObjectType() {
    return (target: any) => {
        createOrSetObjectTypeMetadata(target, {
            name: target.name,
            isInput: true,
        });
    };
}

export function Field(option?: FieldOption) {
    return (target: any, propertyKey: any) => {
        createOrSetFieldTypeMetadata(target, {
            name: propertyKey,
            explicitType: option && option.type,
        });
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

export function List() {
    return (target: any, propertyKey: any, index?: any) => {
        if (index >= 0 && typeof index === "number") {
            setArgumentMetadata(target, propertyKey, index, {
                isList: true,
            });
        } else {
            createOrSetFieldTypeMetadata(target, {
                name: propertyKey,
                isList: true,
            });
        }
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

export function Description(body: string) {
    return (target: any, propertyKey?: any, index?: any): any => {
        if (index >= 0 && typeof index === "number") {
            setArgumentMetadata(target, propertyKey, index, {
                description: body,
            });
        } else if (propertyKey) {
            createOrSetFieldTypeMetadata(target, {
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

export function Query(option?: any) {
    return (target: any, propertyKey: any) => {
        Reflect.defineMetadata(GQ_QUERY_KEY, propertyKey, target);
    };
}

export function Mutation() {
    return (target: any, propertyKey: any) => {
        Reflect.defineMetadata(GQ_MUTATION_KEY, propertyKey, target);
    };
}

export function Schema() {
    return (target: any) => {
        Reflect.defineMetadata(GQ_SCHEMA_KEY, {}, target);
    };
}
