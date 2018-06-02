import {Connection, connectionFromArray} from "graphql-relay";
import {isNullOrUndefined} from "util";
import {Field, ObjectType} from "../decorator";
import {ProjectMemberType} from "./project-member.spec";

@ObjectType()
export class ProjectType {
    @Field({type: ProjectMemberType, isConnection: true})
    public async members(): Promise<Connection<ProjectMemberType>> {
        return connectionFromArray([], {
        });
    }
}
