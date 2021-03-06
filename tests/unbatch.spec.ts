import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { unbatch, batch } from "../src";

test.cb("unbatch() unbatches", t => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c"];
    let i = 0;
    source
        .pipe(batch(3))
        .pipe(unbatch())
        .on("data", (element: string) => {
            expect(element).to.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});
