import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import mhysa from "../src";
const { batch } = mhysa({ objectMode: true });

test.cb("batch() batches chunks together", t => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = [["a", "b", "c"], ["d", "e", "f"], ["g"]];
    let i = 0;
    source
        .pipe(batch(3))
        .on("data", (element: string[]) => {
            t.deepEqual(element, expectedElements[i]);
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push("d");
    source.push("e");
    source.push("f");
    source.push("g");
    source.push(null);
});

test.cb("batch() yields a batch after the timeout", t => {
    t.plan(3);
    const source = new Readable({
        objectMode: true,
        read(size: number) {
            return;
        },
    });
    const expectedElements = [["a", "b"], ["c"], ["d"]];
    let i = 0;
    source
        .pipe(batch(3))
        .on("data", (element: string[]) => {
            t.deepEqual(element, expectedElements[i]);
            i++;
        })
        .on("error", t.fail)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    setTimeout(() => {
        source.push("c");
    }, 600);
    setTimeout(() => {
        source.push("d");
        source.push(null);
    }, 600 * 2);
});
