import {GraphQLInputObjectType, GraphQLObjectType} from "graphql";
import {FieldTypeMetadata, GQ_FIELDS_KEY, GQ_OBJECT_METADATA_KEY, GQ_QUERY_KEY, ObjectTypeMetadata} from "./decorator";
import {fieldTypeFactory} from "./field_type_factory";
import {SchemaFactoryError, SchemaFactoryErrorType} from "./schema_factory";

let objectTypeRepository: { [key: string]: any } = {};
export let typeRepository: { [key: string]: any } = {};
let explicitTypeNameRepository: { [key: string]: any[] } = {};

export function clearObjectTypeRepository() {
    objectTypeRepository = {};
    typeRepository = {};
    explicitTypeNameRepository = {};
}

export function mergeObjectTypes(target: any, isInput: boolean, isSubscription: boolean, fields: { [key: string]: any }) {
    const objectTypeMetadata = Reflect.getMetadata(GQ_OBJECT_METADATA_KEY, target.prototype) as ObjectTypeMetadata;
    for (const mergeObjectType of objectTypeMetadata.merge) {
        const mergeObjectTypeMetadata = Reflect.getMetadata(GQ_OBJECT_METADATA_KEY, mergeObjectType.prototype) as ObjectTypeMetadata;

        if (mergeObjectTypeMetadata.merge) {
            mergeObjectTypes(mergeObjectType, isInput, isSubscription, fields);
        }

        const fieldMetadataList = Reflect.getMetadata(GQ_FIELDS_KEY, mergeObjectType.prototype) as FieldTypeMetadata[];
        if (fieldMetadataList && Array.isArray(fieldMetadataList)) {
            fieldMetadataList.filter((def) => def && def.name).forEach((def) => {
                fields[def.name] = fieldTypeFactory(mergeObjectType, def, isInput, isSubscription);
            });
        }
    }
}

export function objectTypeFactory(target: any, isInput?: boolean, isSubscription?: boolean) {
    const objectTypeMetadata = Reflect.getMetadata(GQ_OBJECT_METADATA_KEY, target.prototype) as ObjectTypeMetadata;

    const typeFromRepository = objectTypeRepository[objectTypeMetadata.name];
    if (typeFromRepository) {
        return typeFromRepository;
    }
    if (!!objectTypeMetadata.isInput !== !!isInput) {
        // TODO write test
        throw new SchemaFactoryError("", SchemaFactoryErrorType.INVALID_OBJECT_TYPE_METADATA);
    }

    const fieldMetadataList = Reflect.getMetadata(GQ_FIELDS_KEY, target.prototype) as FieldTypeMetadata[] || [];
    const fields: { [key: string]: any } = {};

    fieldMetadataList.filter((def) => def && def.name).forEach((def) => {
        fields[def.name] = fieldTypeFactory(target, def, isInput, isSubscription);
        if (def.explicitTypeName) {
            if (!explicitTypeNameRepository[def.explicitTypeName]) {
                explicitTypeNameRepository[def.explicitTypeName] = [];
            }
            explicitTypeNameRepository[def.explicitTypeName].push(def);
        }
    });

    if (objectTypeMetadata.merge) {
        mergeObjectTypes(target, isInput, isSubscription, fields);
    }

    if (Object.keys(fields).length === 0) {
        throw new SchemaFactoryError("Class annotated by @ObjectType() should has one or more fields annotated by @Filed()", SchemaFactoryErrorType.NO_FIELD);
    }

    const config = {
        name: objectTypeMetadata.name,
        fields,
        description: objectTypeMetadata.description,
    };

    Object.keys(explicitTypeNameRepository).forEach((explicitTypeName) => {
        for (const field of explicitTypeNameRepository[explicitTypeName]) {
            field.explicitType = typeRepository[explicitTypeName];
        }
    });

    typeRepository[objectTypeMetadata.name] = target;

    if (!objectTypeRepository[objectTypeMetadata.name]) {
        objectTypeRepository[objectTypeMetadata.name] = !!isInput ? new GraphQLInputObjectType(config) : new GraphQLObjectType(config);
    }
    fieldMetadataList.filter((def) => def && def.name).forEach((def) => {
        if (def.explicitTypeName && explicitTypeNameRepository[def.explicitTypeName]) {
            fields[def.name] = fieldTypeFactory(target, def, isInput, isSubscription);
        }
    });

    return objectTypeRepository[objectTypeMetadata.name];
}
