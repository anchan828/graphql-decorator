import * as assert from "assert";
import "reflect-metadata";
import * as D from "./decorator";
import {clearObjectTypeRepository} from "./object_type_factory";
import {schemaFactory, SchemaFactoryError, SchemaFactoryErrorType} from "./schema_factory";

import {execute, GraphQLInt, parse, printSchema, validate} from "graphql";

describe("schemaFactory", () => {
    beforeEach(() => {
        clearObjectTypeRepository();
    });

    it("throws an error with Schema class not annotated", () => {
        class Schema {
        }

        try {
            schemaFactory(Schema);
        } catch (e) {
            const err = e as SchemaFactoryError;
            assert(err.type === SchemaFactoryErrorType.NO_SCHEMA_ANNOTATION);
        }
    });

    it("throws an error with Schema class which has no field annotated by @Query()", () => {
        @D.Schema()
        class Schema {
        }

        try {
            schemaFactory(Schema);
        } catch (e) {
            const err = e as SchemaFactoryError;
            assert(err.type === SchemaFactoryErrorType.NO_QUERY_FIELD);
        }
    });

    it("throws an error with Schema class which has an invalid Query class", () => {
        class Query {
        }

        @D.Schema()
        class Schema {
            @D.Query() public query: Query;
        }

        try {
            schemaFactory(Schema);
            assert(false, "Assertion Error");
        } catch (e) {
            const err = e as SchemaFactoryError;
            // console.log(err.stack);
            // TODO
        }
    });

    it("returns a GraphQL schema object with @Query", () => {
        @D.ObjectType()
        class Query {
            @D.Field()
            public title(): string {
                return "hello";
            }
        }

        @D.Schema()
        class Schema {
            @D.Query() public query: Query;
        }

        const schema = schemaFactory(Schema);
        const ast = parse(`query { title }`);
        assert.deepEqual(validate(schema, ast), []);
    });

    it("returns a GraphQL schema object with @Mutation", () => {
        @D.ObjectType()
        class Query {
            @D.Field()
            public title(): string {
                return "hello";
            }
        }

        @D.ObjectType()
        class Mutation {
            @D.Field()
            public countup(): number {
                return 0;
            }
        }

        @D.Schema()
        class Schema {
            @D.Query() public query: Query;
            @D.Mutation() public mutation: Mutation;
        }

        const schema = schemaFactory(Schema);
        const ast = parse(`mutation { countup }`);
        assert.deepEqual(validate(schema, ast), []);
    });

    it("returns a GraphQL schema object which is executable", async () => {
        @D.ObjectType()
        class Query {
            @D.Field()
            public title(): string {
                return "hello";
            }
        }

        @D.Schema()
        class Schema {
            @D.Query() public query: Query;
        }

        const schema = schemaFactory(Schema);
        const ast = parse(`query { title }`);
        const actual = await execute(schema, ast) as { data: { title: string } };
        assert(actual.data.title === "hello");
    });

    it("returns a GraphQL schema object which is executable", async () => {
        @D.ObjectType()
        class Query {
            @D.Field()
            public twice(@D.Arg({name: "input"}) input: number): number {
                return input * 2;
            }
        }

        @D.Schema()
        class Schema {
            @D.Query() public query: Query;
        }

        const schema = schemaFactory(Schema);
        const ast = parse(`query { twice(input: 1) }`);
        assert.deepEqual(validate(schema, ast), []);
        const actual = await execute(schema, ast) as { data: { twice: number } };
        assert(actual.data.twice === 2);
    });

    it("returns a GraphQL schema object which is executable", async () => {
        @D.InputObjectType()
        class Input {
            @D.Field() public a: number;
            @D.Field() public b: number;
        }

        @D.ObjectType()
        class Query {
            @D.Field()
            public add(@D.Arg({name: "input"}) input: Input): number {
                return input.a + input.b;
            }
        }

        @D.ObjectType({merge: [Query]})
        class Query2 {
            @D.Field()
            public add2(@D.Arg({name: "input"}) input: Input): number {
                return input.a + input.b;
            }
        }

        @D.Schema()
        class Schema {
            @D.Query() public query: Query2;
        }

        const schema = schemaFactory(Schema);
        const ast = parse(
            `query {
                add(input: {a: 1, b: 1})
                add2(input: {a: 1, b: 1})
            }`,
        );
        assert.deepEqual(validate(schema, ast), []);
        const actual = await execute(schema, ast) as { data: { add: number } };
        assert(actual.data.add === 2);
    });

    it("returns a GraphQL schema object which is executable", async () => {
        @D.ObjectType()
        class Query {
            @D.Field({type: GraphQLInt})
            public async twice(@D.Arg({name: "input"}) input: number): Promise<number> {
                return input * 2;
            }
        }

        @D.Schema()
        class Schema {
            @D.Query() public query: Query;
        }

        const schema = schemaFactory(Schema);
        const ast = parse(`query { twice(input: 1) }`);
        assert.deepEqual(validate(schema, ast), []);
        const actual = await execute(schema, ast) as { data: { twice: number } };
        assert(actual.data.twice === 2);
    });

    it("returns a GraphQL schema object which is executable", async () => {
        @D.ObjectType()
        class Query {
            @D.Field({type: GraphQLInt}) @D.List(2)
            public async twice(@D.Arg({name: "input"}) input: number): Promise<number[][]> {
                return [[input * 1, input * 2], [input * 3, input * 4]];
            }
        }

        @D.Schema()
        class Schema {
            @D.Query() public query: Query;
        }

        const schema = schemaFactory(Schema);
        const ast = parse(`query { twice(input: 1) }`);
        assert.deepEqual(validate(schema, ast), []);
        const actual = await execute(schema, ast) as { data: { twice: number[][] } };
        assert.deepEqual(actual.data.twice, [[1, 2], [3, 4]]);
    });

    it("returns a GraphQL schema object which is executable", async () => {
        @D.ObjectType()
        class Query {
            @D.Field({type: GraphQLInt}) @D.List(2)
            public async twice(@D.Arg({name: "input"}) input: number): Promise<number[][]> {
                return [[input * 1, input * 2], [input * 3, input * 4]];
            }
        }

        @D.ObjectType()
        class Subscription {
            @D.Field({type: GraphQLInt}) @D.List(2)
            public async subscrip(@D.Arg({name: "input"}) input: number): Promise<number[][]> {
                return [[input * 1, input * 2], [input * 3, input * 4]];
            }
        }

        @D.Schema()
        class Schema {
            @D.Query() public query: Query;
            @D.Subscription() public subscription: Subscription;
        }

        const schema = schemaFactory(Schema);
        assert.equal(printSchema(schema), `type Query {
  twice(input: Int): [[Int]]
}

type Subscription {
  subscrip(input: Int): [[Int]]
}
`);
    });
});
