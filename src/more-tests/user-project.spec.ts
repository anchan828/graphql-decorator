import {Connection, connectionFromArray, connectionFromPromisedArray} from "graphql-relay";
import {Field, ObjectType} from "../decorator";
import {ProjectType} from "./project.spec";

@ObjectType()
export class UserProjectQuery {
    @Field({
        type: ProjectType,
        isConnection: true,
    })
    public async projects(): Promise<Connection<any>> {
        return connectionFromArray([], {});
    }
}
