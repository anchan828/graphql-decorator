import {
    Arg,
    Description,
    Field,
    InputObjectType,
    List,
    Mutation,
    NonNull,
    ObjectType,
    Query,
    Schema,
    schemaFactory,
} from "@anchan828/graphql-decorator";

import {createHash} from "crypto";
import {GraphQLID, GraphQLString} from "graphql";
import {users as data} from "./data";

let users = data.slice();

@ObjectType()
@Description("A user type.")
class User {
    @NonNull() @Field() public id: string;
    @Field() public name: string;
    @NonNull() @Field() public email: string;
}

@ObjectType()
@Description("A root query.")
class QueryType {
    @Description("return all users.")
    @List() @Field({type: User})
    public allUsers(): User[] {
        return users;
    }
}

@InputObjectType()
@Description("A input object to update a user.")
class UserForUpdate {
    @Field() public name: string;
    @Field() public email: string;
}

@InputObjectType()
@Description("A input object to create a user.")
class UserForCreate {
    @Field() public name: string;
    @NonNull() @Field() public email: string;
}

@ObjectType()
@Description("Mutations.")
class MutationType {

    @Field({type: User})
    @Description("Update a user and return the changed user.")
    public changeUser(@NonNull() @Arg({name: "id"}) id: string,
                      @Arg({name: "input"}) input: UserForUpdate): User {
        const user = users.find((u) => u.id === id) as User;
        if (!user) {
            return null;
        }
        Object.assign(user, input);
        return user;
    }

    @Field({type: User})
    @Description("Create a user and return the created user.")
    public addUser(@NonNull() @Arg({name: "input"}) input: UserForCreate): User {
        const newUser = new User();
        const shasum = createHash("sha1");
        shasum.update("usr" + Date.now());
        newUser.id = shasum.digest("hex");
        Object.assign(newUser, input);
        users.push(newUser);
        return newUser;
    }

    @Field({type: User})
    @Description("Delete a user and return the removed user.")
    public deleteUser(@NonNull() @Arg({name: "id"}) id: string): User {
        const user = users.find((u) => u.id === id) as User;
        if (!user) {
            return null;
        }
        users = users.filter((u) => u.id !== user.id);
        return user;
    }
}

@Schema()
class RootSchema {
    @Query() public query: QueryType;
    @Mutation() public mutation: MutationType;
}

export const schema = schemaFactory(RootSchema);
