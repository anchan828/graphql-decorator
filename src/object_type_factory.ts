import {GraphQLInputObjectType, GraphQLObjectType} from "graphql";
import {FieldTypeMetadata, GQ_FIELDS_KEY, GQ_OBJECT_METADATA_KEY, ObjectTypeMetadata} from "./decorator";
import {fieldTypeFactory} from "./field_type_factory";
import {SchemaFactoryError, SchemaFactoryErrorType} from "./schema_factory";

let objectTypeRepository: { [key: string]: any } = {};

export function clearObjectTypeRepository() {
    objectTypeRepository = {};
}

export function objectTypeFactory(target: any, isInput?: boolean) {
    const objectTypeMetadata = Reflect.getMetadata(GQ_OBJECT_METADATA_KEY, target.prototype) as ObjectTypeMetadata;
    const typeFromRepository = objectTypeRepository[objectTypeMetadata.name];
    if (typeFromRepository) {
        return typeFromRepository;
    }
    if (!!objectTypeMetadata.isInput !== !!isInput) {
        // TODO write test
        throw new SchemaFactoryError("", SchemaFactoryErrorType.INVALID_OBJECT_TYPE_METADATA);
    }
    if (!Reflect.hasMetadata(GQ_FIELDS_KEY, target.prototype)) {
        throw new SchemaFactoryError("Class annotated by @ObjectType() should has one or more fields annotated by @Filed()", SchemaFactoryErrorType.NO_FIELD);
    }
    const fieldMetadataList = Reflect.getMetadata(GQ_FIELDS_KEY, target.prototype) as FieldTypeMetadata[];
    const fields: { [key: string]: any } = {};
    fieldMetadataList.forEach((def) => {
        fields[def.name] = fieldTypeFactory(target, def);
    });
    if (!!isInput) {
        objectTypeRepository[objectTypeMetadata.name] = new GraphQLInputObjectType({
            name: objectTypeMetadata.name,
            fields,
            description: objectTypeMetadata.description,
        });
    } else {
        objectTypeRepository[objectTypeMetadata.name] = new GraphQLObjectType({
            name: objectTypeMetadata.name,
            fields,
            description: objectTypeMetadata.description,
        });
    }
    return objectTypeRepository[objectTypeMetadata.name];
}
