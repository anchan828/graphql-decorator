import {Arg, Field, ObjectType} from "../decorator";

@ObjectType()
export class ProjectMemberType {
    @Field() public id: number;

    @Field({typeName: "UserType"})
    public user(@Arg({name: "a"}) a: string): Promise<any> {
        return null;
    }
}
