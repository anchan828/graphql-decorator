import {GraphQLSchema} from "graphql";
import {GQ_MUTATION_KEY, GQ_QUERY_KEY, GQ_SCHEMA_KEY, GQ_SUBSCRIPTION_KEY} from "./decorator";
import {objectTypeFactory} from "./object_type_factory";

export enum SchemaFactoryErrorType {
    NO_SCHEMA_ANNOTATION,
    NO_QUERY_FIELD,
    NO_FIELD,
    NO_ENUM_VALUE,
    INVALID_OBJECT_TYPE_METADATA,
    INPUT_FIELD_SHOULD_NOT_BE_FUNC,
    ENUM_VALUE_SHOULD_NOT_BE_FUNC,
}

export class SchemaFactoryError extends Error {
    constructor(msg: string, public type: SchemaFactoryErrorType) {
        super(msg);
        this.message = msg;
    }
}

export function schemaFactory(target: any) {
    if (!Reflect.hasMetadata(GQ_SCHEMA_KEY, target)) {
        throw new SchemaFactoryError("The argument of schemaFactory should be annotated @Schema() decorator", SchemaFactoryErrorType.NO_SCHEMA_ANNOTATION);
    }
    if (!Reflect.hasMetadata(GQ_QUERY_KEY, target.prototype)) {
        throw new SchemaFactoryError("Target should has @Query field", SchemaFactoryErrorType.NO_QUERY_FIELD);
    }
    const queryKey = Reflect.getMetadata(GQ_QUERY_KEY, target.prototype) as string;
    const queryTypeFn = Reflect.getMetadata("design:type", target.prototype, queryKey);

    const schema: {
        query: any,
        mutation?: any,
        subscription?: any,
    } = {
        query: objectTypeFactory(queryTypeFn),
    };

    if (Reflect.hasMetadata(GQ_MUTATION_KEY, target.prototype)) {
        const mutationKey = Reflect.getMetadata(GQ_MUTATION_KEY, target.prototype) as string;
        const mutationTypeFn = Reflect.getMetadata("design:type", target.prototype, mutationKey);
        schema.mutation = objectTypeFactory(mutationTypeFn);
    }

    if (Reflect.hasMetadata(GQ_SUBSCRIPTION_KEY, target.prototype)) {
        const subscriptionKey = Reflect.getMetadata(GQ_SUBSCRIPTION_KEY, target.prototype) as string;
        const subscriptionTypeFn = Reflect.getMetadata("design:type", target.prototype, subscriptionKey);
        schema.subscription = objectTypeFactory(subscriptionTypeFn);
    }

    return new GraphQLSchema(schema);
}
