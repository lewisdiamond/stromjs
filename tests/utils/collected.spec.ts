import test from "ava";
import { collected } from "../../src/utils";
import { strom } from "../../src";
const { fromArray, collect } = strom({ objectMode: true });

test("collected returns a promise for the first data point", async t => {
    const data = collected(fromArray([1, 2, 3, 4]).pipe(collect()));
    t.deepEqual(await data, [1, 2, 3, 4]);
});
