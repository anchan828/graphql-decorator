import {GraphQLBoolean, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLString} from "graphql";
import {
    ArgumentMetadata, ContextMetadata, FieldTypeMetadata, GQ_ENUM_KEY, GQ_OBJECT_METADATA_KEY, RootMetadata,
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
        returnType = metadata.explicitType;
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

export function resolverFactory(target: any, name: string, argumentMetadataList: ArgumentMetadata[], rootMetadata?: RootMetadata, contextMetadata?: ContextMetadata): ResolverHolder {
    const params = Reflect.getMetadata("design:paramtypes", target.prototype, name) as Array<() => void>;
    const argumentConfigMap: { [name: string]: any; } = {};
    const indexMap: { [name: string]: number; } = {};
    params.forEach((paramFn, index) => {

        if (argumentMetadataList == null || argumentMetadataList[index] == null) {
            if (contextMetadata) {
                indexMap["context"] = contextMetadata.index;
            }
            if (rootMetadata) {
                indexMap["root"] = rootMetadata.index;
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

        if (rootMetadata) {
            const index = indexMap["root"];
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

export function fieldTypeFactory(target: any, metadata: FieldTypeMetadata, isInput?: boolean) {
    let typeFn = Reflect.getMetadata("design:type", target.prototype, metadata.name) as any;
    let resolveFn: any;
    let args: { [name: string]: any; };

    const description = metadata.description;
    const isFunctionType = Reflect.getMetadata("design:type", target.prototype, metadata.name) === Function;

    if (isInput && isFunctionType) {
        // TODO write test
        throw new SchemaFactoryError("Field declared in a class annotated by @InputObjectType should not be a function", SchemaFactoryErrorType.INPUT_FIELD_SHOULD_NOT_BE_FUNC);
    }

    if (isFunctionType) {
        if (!metadata.explicitType) {
            typeFn = Reflect.getMetadata("design:returntype", target.prototype, metadata.name) as any;
        }
        const resolverHolder = resolverFactory(target, metadata.name, metadata.args, metadata.root, metadata.context);
        resolveFn = resolverHolder.fn;
        args = resolverHolder.argumentConfigMap;
    }

    const fieldType = convertType(typeFn, metadata, isInput);

    if (!fieldType) {
        return null;
    }

    if (metadata.resolve) {
        resolveFn = metadata.resolve;
    }

    return {
        type: fieldType,
        description: description && description,
        args: args && args,
        resolve: resolveFn,
    };
}
