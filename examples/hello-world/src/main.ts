/* main.ts */

import {Field, ObjectType, Query, Schema, schemaFactory} from "@anchan828/graphql-decorator";
import {graphql} from "graphql";

// @ObjectType creates GraphQLObjectType from a class
@ObjectType()
class QueryType {
    @Field()
    public greeting(): string {
        return "Hello, world!";
    }
}

// @Schema creates GraphQLSchema from a class.
// The class should have a field annotated by @Query decorator.
@Schema()
class SchemaType {
    @Query() public query: QueryType;
}

async function main() {

    // create schema from annotated class
    const schema = schemaFactory(SchemaType);

    const result = await graphql(schema, `query { greeting } `);
    console.log(result.data.greeting);
}

main();
