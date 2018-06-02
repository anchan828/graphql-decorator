import * as D from "../decorator";
import {UserType} from "./user.spec";

@D.ObjectType()
export class UserQuery {
    @D.Field({type: UserType})
    @D.NonNull()
    public viewer(@D.Ctx() ctx: any): any {
        return ctx.user;
    }
}
