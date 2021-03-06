import {GraphQLBoolean, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLString} from "graphql";
import {connectionArgs, connectionDefinitions} from "graphql-relay";
import {
    ArgumentMetadata, ContextMetadata, DescriptionMetadata, FieldTypeMetadata, GQ_DESCRIPTION_KEY, GQ_ENUM_KEY,
    GQ_OBJECT_METADATA_KEY,
    ParentMetadata,
    TypeMetadata,
} from "./decorator";
import {enumTypeFactory} from "./enum_type_factory";
import {objectTypeFactory} from "./object_type_factory";
import {SchemaFactoryError, SchemaFactoryErrorType} from "./schema_factory";

export interface ResolverHolder {
    fn: any;
    argumentConfigMap: { [name: string]: any; };
}

function convertType(typeFn: any, metadata: TypeMetadata, isInput: boolean) {
    let returnType: any;
    if (!metadata.explicitType) {

        if (typeFn === Number) {
            returnType = GraphQLInt;     // FIXME or float?
        } else if (typeFn === String) {
            returnType = GraphQLString;
        } else if (typeFn === Boolean) {
            returnType = GraphQLBoolean;
        } else if (typeFn && typeFn.prototype && Reflect.hasMetadata(GQ_OBJECT_METADATA_KEY, typeFn.prototype)) {
            // recursively call objectFactory
            returnType = objectTypeFactory(typeFn, isInput);
        }
    } else {

        try {
            returnType = typeof metadata.explicitType === "function" ? metadata.explicitType() : metadata.explicitType;
        } catch (e) {
            returnType = metadata.explicitType;
        }

        if (returnType && returnType.prototype && Reflect.hasMetadata(GQ_OBJECT_METADATA_KEY, returnType.prototype)) {
            // recursively call objectFactory
            returnType = objectTypeFactory(returnType, isInput);
        } else if (returnType && returnType.prototype && Reflect.hasMetadata(GQ_ENUM_KEY, returnType.prototype)) {
            returnType = enumTypeFactory(returnType);
        }
    }

    if (!returnType) {
        return null;
    }

    if (metadata.isList) {
        for (let i = 0; i < (metadata.multidimensionalList || 1); i++) {
            returnType = new GraphQLList(returnType);
        }
    }

    if (metadata.isNonNull) {
        returnType = new GraphQLNonNull(returnType);
    }

    return returnType;
}

export function resolverFactory(target: any, name: string, argumentMetadataList: ArgumentMetadata[], parentMetadata?: ParentMetadata, contextMetadata?: ContextMetadata): ResolverHolder {
    const params = Reflect.getMetadata("design:paramtypes", target.prototype, name) as Array<() => void>;
    const argumentConfigMap: { [name: string]: any; } = {};
    const indexMap: { [name: string]: number; } = {};
    params.forEach((paramFn, index) => {

        if (argumentMetadataList == null || argumentMetadataList[index] == null) {
            if (contextMetadata) {
                indexMap["context"] = contextMetadata.index;
            }
            if (parentMetadata) {
                indexMap["parent"] = parentMetadata.index;
            }
        } else {
            const metadata = argumentMetadataList[index];
            if (metadata) {
                argumentConfigMap[metadata.name] = {
                    name: metadata.name,
                    type: convertType(paramFn, metadata, true),
                };
                indexMap[metadata.name] = index;
            }
        }
    });
    const originalFn = target.prototype[name] as any;
    const fn = (source: any, args: { [name: string]: any; }, context: any, info: any) => {
        const rest: any[] = [];
        // TODO inject context and info to rest arguments
        Object.keys(args).forEach((key) => {
            const index = indexMap[key];
            if (index >= 0) {
                rest[index] = args[key];
            }
        });

        if (contextMetadata) {
            const index = indexMap["context"];
            if (index >= 0) {
                rest[index] = context;
            }
        }

        if (parentMetadata) {
            const index = indexMap["parent"];
            if (index >= 0) {
                rest[index] = source;
            }
        }

        return originalFn.apply(source, rest);
    };

    return {
        fn, argumentConfigMap,
    };
}

export function fieldTypeFactory(target: any, metadata: FieldTypeMetadata, isInput?: boolean, isSubscription?: boolean) {
    let typeFn = Reflect.getMetadata("design:type", target.prototype, metadata.name) as any;
    let resolveFn: any;
    let subscribeFn: any;
    let args: { [name: string]: any; };

    let description = metadata.description;

    if (Reflect.hasMetadata(GQ_DESCRIPTION_KEY, target.prototype)) {
        const descriptionMetadata = (Reflect.getMetadata(GQ_DESCRIPTION_KEY, target.prototype) as DescriptionMetadata[]).find((def) => def.name === metadata.name);

        if (descriptionMetadata) {
            description = descriptionMetadata.description;
        }
    }

    const isFunctionType = Reflect.getMetadata("design:type", target.prototype, metadata.name) === Function;

    if (isInput && isFunctionType) {
        // TODO write test
        throw new SchemaFactoryError("Field declared in a class annotated by @InputObjectType should not be a function", SchemaFactoryErrorType.INPUT_FIELD_SHOULD_NOT_BE_FUNC);
    }

    if (isFunctionType) {
        if (!metadata.explicitType && !metadata.explicitTypeName) {
            typeFn = Reflect.getMetadata("design:returntype", target.prototype, metadata.name) as any;
        }

        const resolverHolder = resolverFactory(target, metadata.name, metadata.args, metadata.parent, metadata.context);
        resolveFn = resolverHolder.fn;
        args = resolverHolder.argumentConfigMap;
    }

    if (isSubscription) {
        const resolverHolder = resolverFactory(target, metadata.name, metadata.args, metadata.parent, metadata.context);
        subscribeFn = resolverHolder.fn;
        args = resolverHolder.argumentConfigMap;
    }

    const fieldType = convertType(typeFn, metadata, isInput);

    if (!fieldType) {
        return null;
    }

    const field = {
        type: fieldType,
        description: description && description,
        args,
        resolve: resolveFn,
        subscribe: subscribeFn,
    };

    if (metadata.isConnection) {
        const {connectionType} = connectionDefinitions({
            name: metadata.name.charAt(0).toUpperCase() + metadata.name.slice(1),
            nodeType: fieldType,
        });
        field.type = connectionType;
        field.args = {...args, ...connectionArgs};
    }

    if (!!isInput) {
        delete field.resolve;
    }

    return field;
}
