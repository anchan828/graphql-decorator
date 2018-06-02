import * as assert from "assert";
import * as D from "../decorator";
import {schemaFactory} from "../schema_factory";
import {UserQuery} from "./user-query.spec";
import {UserType} from "./user.spec";

describe("more test", async () => {
    it("", async () => {
        @D.ObjectType({
            merge: [UserQuery],
        })
        class QueryType {
        }

        @D.Schema({
            explicitTypes: [UserType],
        })
        class RootSchema {
            @D.Query() public query: QueryType;
        }

        const schema = schemaFactory(RootSchema);
        assert(schema);
    });
});
