import {GraphQLEnumType} from "graphql";
import {
    DescriptionMetadata,
    EnumTypeMetadata,
    EnumValueMetadata,
    GQ_DESCRIPTION_KEY,
    GQ_ENUM_KEY,
    GQ_ENUM_VALUE_KEY,
} from "./decorator";
import {SchemaFactoryError, SchemaFactoryErrorType} from "./schema_factory";

let cachedEnumTypes: { [name: string]: GraphQLEnumType } = {};

export function clearEnumTypeCache() {
    cachedEnumTypes = {};
}

export function enumTypeFactory(target: any): GraphQLEnumType {
    const enumTypeMetadata = Reflect.getMetadata(GQ_ENUM_KEY, target.prototype) as EnumTypeMetadata;

    if (!Reflect.hasMetadata(GQ_ENUM_VALUE_KEY, target.prototype)) {
        throw new SchemaFactoryError("Class annotated by @Enum() should has one or more fields annotated by @EnumValue()",
            SchemaFactoryErrorType.NO_ENUM_VALUE);
    }

    const valueMetadataList = Reflect.getMetadata(GQ_ENUM_VALUE_KEY, target.prototype) as EnumValueMetadata[];

    const values: { [key: string]: any } = {};
    valueMetadataList.forEach((def) => {
        values[def.name] = enumValueTypeFactory(target, def);
    });

    if (!cachedEnumTypes[enumTypeMetadata.name]) {
        cachedEnumTypes[enumTypeMetadata.name] = new GraphQLEnumType({
            name: enumTypeMetadata.name,
            description: enumTypeMetadata.description,
            values,
        });
    }
    return cachedEnumTypes[enumTypeMetadata.name];

}

export function enumValueTypeFactory(target: any, metadata: EnumValueMetadata): any {
    let description;

    if (Reflect.hasMetadata(GQ_DESCRIPTION_KEY, target.prototype)) {
        const descriptionMetadata = (Reflect.getMetadata(GQ_DESCRIPTION_KEY, target.prototype) as DescriptionMetadata[]).find((def) => def.name === metadata.name);

        if (descriptionMetadata) {
            description = descriptionMetadata.description;
        }
    }

    const value = metadata.value;
    const isFunctionType = Reflect.getMetadata("design:type", target.prototype, metadata.name) === Function;
    let valueType;

    if (isFunctionType) {
        throw new SchemaFactoryError("EnumValue declared in a class annotated by @Enum should not be a function",
            SchemaFactoryErrorType.ENUM_VALUE_SHOULD_NOT_BE_FUNC);
    }

    if (value != null) {
        valueType = {
            value,
            description,
        };
    } else {
        valueType = {
            description,
        };
    }

    return valueType;
}
