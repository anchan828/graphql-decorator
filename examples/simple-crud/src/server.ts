import * as express from "express";
import * as graphqlHTTP from "express-graphql";
import {schema} from "./schema";

const app = express();

app.use("/graphql", graphqlHTTP({schema, graphiql: true}));

app.listen(3000, () => {
    console.log("graphql server listen to 3000");
});
