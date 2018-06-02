import * as assert from "assert";
import {execute, graphql, GraphQLFloat, GraphQLInt, parse, printSchema, validate} from "graphql";
import {Connection, ConnectionArguments, connectionFromArray} from "graphql-relay";
import "reflect-metadata";
import * as D from "./decorator";
import {EnumValue, List} from "./decorator";
import {clearObjectTypeRepository} from "./object_type_factory";
import {schemaFactory, SchemaFactoryError, SchemaFactoryErrorType} from "./schema_factory";

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

    it("returns a GraphQL schema object which is executable", async () => {

        @D.Enum()
        class Obj {
            @EnumValue(1)
            public test: number;
        }

        @D.ObjectType()
        class Query {
            @D.Field({type: GraphQLInt}) @D.List(2)
            public async twice(@D.Arg({name: "input", type: Obj}) obj: number): Promise<number> {
                return obj;
            }

            @D.Field({type: GraphQLInt}) @D.List(2)
            public async twice2(@D.Arg({name: "input", type: Obj}) obj: number): Promise<number> {
                return obj;
            }
        }

        @D.Schema()
        class Schema {
            @D.Query() public query: Query;
        }

        const schema = schemaFactory(Schema);
        assert.equal(printSchema(schema), `enum Obj {
  test
}

type Query {
  twice(input: Obj): [[Int]]
  twice2(input: Obj): [[Int]]
}
`);
    });

    it("merge @ObjectType", () => {

        @D.ObjectType()
        class Obj0 {
            @D.Field() public title1: string;
        }

        @D.ObjectType({
            merge: [Obj0],
        })
        class Obj1 {
            @D.Field() public title2: string;
        }

        @D.ObjectType({
            merge: [Obj1],
        })
        class Obj2 {
            @D.Field() public title3: string;
        }

        @D.ObjectType({
            merge: [Obj2],
        })
        class Query {
        }

        @D.Schema()
        class Schema {
            @D.Query() public query: Query;
        }

        const schema = schemaFactory(Schema);
        assert.equal(printSchema(schema), `type Query {
  title1: String
  title2: String
  title3: String
}
`);

    });

    it("returns a GraphQL schema object which is executable", async () => {

        @D.ObjectType()
        class Query {
            @D.Field({type: GraphQLInt, isConnection: true})
            public twice(@D.Arg({
                             name: "input",
                             type: GraphQLFloat,
                         }) input: number,
                         @D.Arg({name: "first"}) first: number): Connection<any> {
                return connectionFromArray<number>([1, 2, 3, 4, 5], {first});
            }

            @D.Field({type: GraphQLInt, isConnection: true}) @List()
            public twice2(@D.Arg({name: "input"}) input: number, args: ConnectionArguments): Connection<number> {
                return connectionFromArray<number>([1, 2, 3, 4, 5], args || {});
            }
        }

        @D.Schema()
        class Schema {
            @D.Query() public query: Query;
        }

        const schema = schemaFactory(Schema);
        assert(printSchema(schema).includes(`"""An edge in a connection."""
type TwiceEdge {
  """The item at the end of the edge"""
  node: Int

  """A cursor for use in pagination"""
  cursor: String!
}
`));

        const result = await graphql(schema, `{
            twice(input: 1, first: 2) {
                edges {
                    node
                }
                pageInfo {
                    hasPreviousPage
                    hasNextPage
                }
            }
        }`);

        assert.strictEqual(JSON.stringify(result.data), JSON.stringify({
            twice: {
                edges: [{node: 1}, {node: 2}],
                pageInfo: {hasPreviousPage: false, hasNextPage: true},
            },
        }));
    });

    it("returns a GraphQL schema object with @Query", () => {

        @D.ObjectType()
        class A {
            @D.Field()
            public a: string;
        }

        @D.ObjectType()
        class B {
            @D.Field()
            public b: string;
        }

        @D.ObjectType()
        class C {
            @D.Field({typeName: "B"})
            public c: string;
        }

        @D.ObjectType()
        class Query {
            @D.Field({type: A})
            public a(): any {
                return null;
            }

            @D.Field({type: B})
            public b(): any {
                return null;
            }

            @D.Field({typeName: "B"})
            @D.Description("Hello")
            public bByName(): any {
                return null;
            }

            @D.Field({type: C})
            public c(): any {
                return null;
            }
        }

        @D.Schema()
        class Schema {
            @D.Query() public query: Query;
        }

        const schema = schemaFactory(Schema);
        assert.strictEqual(printSchema(schema), `type A {
  a: String
}

type B {
  b: String
}

type C {
  c: B
}

type Query {
  a: A
  b: B

  """Hello"""
  bByName: B
  c: C
}
`);
    });
});
