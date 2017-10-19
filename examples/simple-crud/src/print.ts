import {printSchema} from "graphql";
import {schema} from "./schema";

function main() {
    console.log(printSchema(schema));
}

main();
