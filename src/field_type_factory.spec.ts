import * as assert from "assert";
import * as graphql from "graphql";
import * as D from "./decorator";
import {fieldTypeFactory, resolverFactory} from "./field_type_factory";
import {clearObjectTypeRepository} from "./object_type_factory";

describe("resolverFactory", () => {
    beforeEach(() => {
        clearObjectTypeRepository();
    });

    it("returns argumentConfigMap. The map has GraphQLInt type with a function which has number argument", () => {
        class Obj {
            @D.Field()
            public m(input: number): void {
                /* No body */
            }
        }

        const actual = resolverFactory(Obj, "m", [{name: "input"}]).argumentConfigMap;
        assert(actual["input"].type === graphql.GraphQLInt);
    });

    it("returns argumentConfigMap. The map has GraphQLString type with a function which has string argument", () => {
        class Obj {
            @D.Field()
            public m(input: string): void {
                /* No body */
            }
        }

        const actual = resolverFactory(Obj, "m", [{name: "input"}]).argumentConfigMap;
        assert(actual["input"].type === graphql.GraphQLString);
    });

    it("returns argumentConfigMap. The map has GraphQLBoolean type with a function which has boolean argument", () => {
        class Obj {
            @D.Field()
            public m(input: boolean): void {
                /* No body */
            }
        }

        const actual = resolverFactory(Obj, "m", [{name: "input"}]).argumentConfigMap;
        assert(actual["input"].type === graphql.GraphQLBoolean);
    });

    it("returns fn which is executable", () => {
        class Obj {
            @D.Field()
            public twice(input: number): number {
                return input * 2;
            }
        }

        const fn = resolverFactory(Obj, "twice", [{name: "input"}]).fn;
        const actual = fn(new Obj(), {input: 1});
        assert(actual === 2);
    });
});

describe("fieldTypeFactory", () => {
    describe("with implicit type", () => {
        it("returns null with a class which has no field", () => {
            class Obj {
            }

            const actual = fieldTypeFactory(Obj, {name: "title"});
            assert(actual === null);
        });

        it("returns null with a class which has a field without @Field", () => {
            class Obj {
                public title: any;
            }

            const actual = fieldTypeFactory(Obj, {name: "title"});
            assert(actual === null);
        });

        it("returns GraphQLInt with a class which has a number field", () => {
            class Obj {
                @D.Field() public count: number;
            }

            const actual = fieldTypeFactory(Obj, {name: "count"});
            assert(actual.type instanceof graphql.GraphQLScalarType);
            assert(actual.type.name === "Int");
        });

        it("returns GraphQLString with a class which has a string field", () => {
            class Obj {
                @D.Field() public title: string;
            }

            const actual = fieldTypeFactory(Obj, {name: "title"});
            assert(actual.type instanceof graphql.GraphQLScalarType);
            assert(actual.type.name === "String");
        });

        it("returns GraphQLBoolean with a class which has a boolean field", () => {
            class Obj {
                @D.Field() public isEnabled: boolean;
            }

            const actual = fieldTypeFactory(Obj, {name: "isEnabled"});
            assert(actual.type instanceof graphql.GraphQLScalarType);
            assert(actual.type.name === "Boolean");
        });

        it("returns GraphQLObjectType with a class which has a field of a class annotated @ObjectType", () => {
            @D.ObjectType()
            class ChildObj {
                @D.Field() public title: string;
            }

            class ParentObj {
                @D.Field() public child: ChildObj;
            }

            const actual = fieldTypeFactory(ParentObj, {name: "child"});
            assert(actual.type instanceof graphql.GraphQLObjectType);
        });

        it("returns description with a class which has description metadata", () => {
            class Obj {
                @D.Field() public title: string;
            }

            const actual = fieldTypeFactory(Obj, {name: "title", description: "this is a title"});
            assert(actual.description === "this is a title");
        });

        it("returns resolve function with a class which has a function field", () => {
            class Obj {
                @D.Field()
                public title(): string {
                    return "hello";
                }
            }

            const actual = fieldTypeFactory(Obj, {name: "title"});
            assert(!!actual.resolve);
        });
    });

    describe("with explicit type", () => {
        it("returns any type which is set by explicitly", () => {
            class Obj {
                @D.Field() public id: string;
            }

            const actual = fieldTypeFactory(Obj, {name: "id", explicitType: graphql.GraphQLID});
            assert(actual.type instanceof graphql.GraphQLScalarType);
            assert(actual.type.name === "ID");
        });

        it("returns GraphQLObjectType with a class which has a field of a class annotated @ObjectType", () => {
            @D.ObjectType()
            class ChildObj {
                @D.Field() public title: string;
            }

            class ParentObj {
                @D.Field({type: ChildObj}) public child: any;
            }

            const actual = fieldTypeFactory(ParentObj, {name: "child", explicitType: ChildObj});
            assert(actual.type instanceof graphql.GraphQLObjectType);
        });

        it("returns resolve function with a class which has a function field", () => {
            class Obj {
                @D.Field()
                public title() {
                    return "hello";
                }
            }

            const actual = fieldTypeFactory(Obj, {name: "title", explicitType: graphql.GraphQLString});
            assert(!!actual.resolve);
        });
    });

    describe("with metadata options", () => {
        it("returns GraphQLNonNull with isNonNull option", () => {
            class Obj {
                @D.Field() public title: string;
            }

            const actual = fieldTypeFactory(Obj, {name: "title", isNonNull: true});
            assert(actual.type instanceof graphql.GraphQLNonNull);
        });

        it("returns GraphQLList with isList option", () => {
            class Obj {
                @D.Field() public users: string[];
            }

            const actual = fieldTypeFactory(Obj, {name: "title", isList: true, explicitType: graphql.GraphQLString});
            assert(actual.type instanceof graphql.GraphQLList);
        });

        it("returns GraphQLNonNull with isList and isNonNull option", () => {
            class Obj {
                @D.Field() public users: string[];
            }

            const actual = fieldTypeFactory(Obj, {
                name: "title",
                isNonNull: true,
                isList: true,
                explicitType: graphql.GraphQLString,
            });
            assert(actual.type instanceof graphql.GraphQLNonNull);
        });
    });
});
