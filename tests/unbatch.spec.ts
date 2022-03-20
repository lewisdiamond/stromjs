import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { unbatch, batch } from "../src";

test("unbatch() unbatches", (t) => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c"];
    let i = 0;

    return new Promise((resolve, reject) => {
        source
            .pipe(batch(3))
            .pipe(unbatch())
            .on("data", (element: string) => {
                expect(element).to.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", reject)
            .on("end", resolve);

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    });
});
