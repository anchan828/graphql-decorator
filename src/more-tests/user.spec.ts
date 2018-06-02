import {Arg, Ctx, Field, ObjectType} from "../decorator";
import {UserProjectQuery} from "./user-project.spec";

@ObjectType({merge: [UserProjectQuery]})
export class UserType {
    @Field()
    public isViewer(@Ctx() ctx: any, @Arg({name: "a"}) a: string): boolean {
        return ctx && ctx.user && ctx.user.id;
    }
}
