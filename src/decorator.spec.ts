import * as assert from "assert";
import "reflect-metadata";
import * as D from "./decorator";
import {
    DescriptionMetadata,
    FieldTypeMetadata,
    getFieldMetadata, GQ_DESCRIPTION_KEY,
    GQ_FIELDS_KEY,
    GQ_OBJECT_METADATA_KEY,
    ObjectTypeMetadata, Parent,
} from "./decorator";

import * as graphql from "graphql";

describe("Decorators", () => {
    describe("@ObjectType", () => {
        it("creates a ObjectTypeMetadata which isInput is false", () => {
            @D.ObjectType()
            class Obj {
                @D.Field() public someField: any;
            }

            const actual = Reflect.getMetadata(GQ_OBJECT_METADATA_KEY, Obj.prototype) as ObjectTypeMetadata;
            assert(actual.isInput === false);
            assert(actual.name === "Obj");
        });

        it("sets description to ObjectTypeMetadata with @Description", () => {
            @D.Description("this is a object type") @D.ObjectType()
            class Obj {
                @D.Field() @D.Description("this is description of field") public someField: any;
            }

            const actual = Reflect.getMetadata(GQ_OBJECT_METADATA_KEY, Obj.prototype) as ObjectTypeMetadata;
            assert(actual.isInput === false);
            assert(actual.name === "Obj");
            assert(actual.description === "this is a object type");
        });
    });

    describe("@InputObjectType", () => {
        it("creates a ObjectTypeMetadata which isInput is true", () => {
            @D.InputObjectType()
            class Obj {
                @D.Field() public someField: any;
            }

            const actual = Reflect.getMetadata(GQ_OBJECT_METADATA_KEY, Obj.prototype) as ObjectTypeMetadata;
            assert(actual.isInput === true);
            assert(actual.name === "Obj");
        });
    });

    describe("@Field", () => {
        it("creates empty FieldTypeMetadata", () => {
            class Obj {
                @D.Field() public someField: any;
            }

            const actual = getFieldMetadata(Obj.prototype, "someField");
            assert(actual.name === "someField");
        });

        it("sets explicitType to FieldTypeMetadata with type option", () => {
            class Obj {
                @D.Field({type: graphql.GraphQLID}) public someField: any;
            }

            const actual = getFieldMetadata(Obj.prototype, "someField");
            assert(actual.name === "someField");
            assert(actual.explicitType === graphql.GraphQLID);
        });

        it("sets description to DescriptionMetadata with @Description", () => {
            class Obj {
                @D.Description("some field") @D.Field() public someField: any;
            }

            const actual = Reflect.getMetadata(GQ_DESCRIPTION_KEY, Obj.prototype) as DescriptionMetadata[];
            assert(actual.length === 1);
            assert(actual[0].name === "someField");
            assert(actual[0].description === "some field");
        });

        it("sets isNonull to FieldTypeMetadata with @NonNull", () => {
            class Obj {
                @D.NonNull() @D.Field() public someField: any;
            }

            const actual = getFieldMetadata(Obj.prototype, "someField");
            assert(actual.name === "someField");
            assert(actual.isNonNull === true);
        });

        it("sets isList to FieldTypeMetadata with @List", () => {
            class Obj {
                @D.List() @D.Field() public someField: any[];
            }

            const actual = getFieldMetadata(Obj.prototype, "someField");
            assert(actual.name === "someField");
            assert(actual.isList === true);
        });

        it("sets complex FieldTypeMetadata", () => {
            class Obj {
                @D.NonNull() @D.Field({type: graphql.GraphQLID}) public someField: any;
            }

            const actual = getFieldMetadata(Obj.prototype, "someField");
            assert(actual.name === "someField");
            assert(actual.explicitType === graphql.GraphQLID);
            assert(actual.isNonNull === true);
        });
    });

    describe("@Arg", () => {
        it("creates FieldTypeMetadata whose has args", () => {
            class Obj {
                @D.Field()
                public someFunction(@D.Arg({name: "input"}) input: any) {
                    // No body
                }
            }

            const actual = getFieldMetadata(Obj.prototype, "someFunction").args[0];
            assert(actual.name === "input");
        });

        it("sets description to ArgumentMetadata with @Description", () => {
            class Obj {
                @D.Field()
                public someFunction(@D.Description("some input") @D.Arg({name: "input"}) input: any) {
                    // No body
                }
            }

            const actual = getFieldMetadata(Obj.prototype, "someFunction").args[0];
            assert(actual.name === "input");
            assert(actual.description === "some input");
        });

        it("sets isNonNull to ArgumentMetadata with @NonNull", () => {
            class Obj {
                @D.Field()
                public someFunction(@D.NonNull() @D.Arg({name: "input"}) input: any) {
                    // No body
                }
            }

            const actual = getFieldMetadata(Obj.prototype, "someFunction").args[0];
            assert(actual.name === "input");
            assert(actual.isNonNull === true);
        });

        it("sets isNonNull to ArgumentMetadata with @List", () => {
            class Obj {
                @D.Field()
                public someFunction(@D.List() @D.Arg({name: "input"}) input: any) {
                    // No body
                }
            }

            const actual = getFieldMetadata(Obj.prototype, "someFunction").args[0];
            assert(actual.name === "input");
            assert(actual.isList === true);
        });
    });

    describe("@Connection", () => {
        it("creates @Connection", () => {

            class Obj {
                @D.Field() @D.Connection() public someField: any;
            }

            const actual = getFieldMetadata(Obj.prototype, "someField");
            assert(actual);
            assert(actual.isConnection);
        });
    });

    describe("@Parent", () => {
        it("creates @Parent", () => {
            class Obj {
                @D.Field()
                public someFunction(@Parent() parentvalue: any, @D.Arg({name: "input"}) input: any) {
                    // No body
                }
            }

            const actual = getFieldMetadata(Obj.prototype, "someFunction").parent;
            assert(actual);
        });
    });
});
