import * as assert from "assert";
import {GraphQLScalarType} from "graphql";
import "reflect-metadata";
import * as D from "./decorator";
import {clearObjectTypeRepository, objectTypeFactory} from "./object_type_factory";
import {SchemaFactoryError, SchemaFactoryErrorType} from "./schema_factory";

describe("objectTypeFactory", () => {
    beforeEach(() => {
        clearObjectTypeRepository();
    });
    it("throws an error with class which has no @Field field", () => {
        @D.ObjectType()
        class Obj {
        }

        try {
            objectTypeFactory(Obj);
            assert.fail("fail");
        } catch (e) {
            const err = e as SchemaFactoryError;
            assert(err.type === SchemaFactoryErrorType.NO_FIELD);
        }
    });

    it("returns GraphQLObjectType with a Class which has string field", () => {
        @D.ObjectType()
        class Obj {
            @D.Field() public title: string;
        }

        const GQLType = objectTypeFactory(Obj);
        assert(GQLType._typeConfig.name === "Obj");
        assert(GQLType._typeConfig.fields.title.type instanceof GraphQLScalarType);
    });

    it("returns GraphQLObjectType with a class annotated by @Description", () => {
        @D.Description("this is a object type")
        @D.ObjectType()
        class Obj {
            @D.Field() public title: string;
        }

        const GQLType = objectTypeFactory(Obj);
        assert(GQLType._typeConfig.description === "this is a object type");
    });

    it("returns GraphQLInputObjectType with a class annotated by @InputObjectType", () => {
        @D.InputObjectType()
        class Obj {
            @D.Field() public title: string;
        }

        const GQLType = objectTypeFactory(Obj, true);
        assert(GQLType._typeConfig.name === "Obj");
    });
});
