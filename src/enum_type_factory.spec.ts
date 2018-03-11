import * as assert from "assert";
import {Description, Enum, EnumValue} from "./decorator";
import {enumTypeFactory} from "./enum_type_factory";
import {clearObjectTypeRepository} from "./object_type_factory";

describe("enumTypeFactory", () => {
    beforeEach(() => {
        clearObjectTypeRepository();
    });
    it("test", () => {

        @Enum()
        class Obj {
            @EnumValue(1) @Description("Description") public TEST1: number;
            @EnumValue("Test") public TEST2: string;
        }

        const actual = enumTypeFactory(Obj).getValues();
        assert.equal(actual[0].name, "TEST1");
        assert.equal(actual[0].value, 1);
        assert.equal(actual[0].description, "Description");
        assert.equal(actual[1].name, "TEST2");
        assert.equal(actual[1].value, "Test");
    });
});
