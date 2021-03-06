import test from "ava";
import { collected } from "../../src/utils";
import { fromArray, collect } from "../../src";

test("collected returns a promise for the first data point", async t => {
    const data = collected(fromArray([1, 2, 3, 4]).pipe(collect()));
    t.deepEqual(await data, [1, 2, 3, 4]);
});
