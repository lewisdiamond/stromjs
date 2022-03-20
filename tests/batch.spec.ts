import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { batch, map, fromArray } from "../src";

test("batch() batches chunks together", (t) => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = [["a", "b", "c"], ["d", "e", "f"], ["g"]];
    let i = 0;
    const ret = new Promise((resolve, reject) => {
        source
            .pipe(batch(3))
            .on("data", (element: string[]) => {
                t.deepEqual(element, expectedElements[i]);
                i++;
            })
            .on("error", resolve)
            .on("end", resolve);
    });

    source.push("a");
    source.push("b");
    source.push("c");
    source.push("d");
    source.push("e");
    source.push("f");
    source.push("g");
    source.push(null);
    return ret;
});

test("batch() yields a batch after the timeout", (t) => {
    t.plan(3);
    const source = new Readable({
        objectMode: true,
        read(size: number) {
            return;
        },
    });
    const expectedElements = [["a", "b"], ["c"], ["d"]];
    let i = 0;
    const ret = new Promise((resolve, reject) => {
        source
            .pipe(batch(3, 500))
            .on("data", (element: string[]) => {
                t.deepEqual(element, expectedElements[i]);
                i++;
            })
            .on("error", reject)
            .on("end", resolve);
    });
    source.push("a");
    source.push("b");
    setTimeout(() => {
        source.push("c");
    }, 600);
    setTimeout(() => {
        source.push("d");
        source.push(null);
    }, 600 * 2);
    return ret;
});

test("batch() yields all input data even when the last element(s) dont make a full batch", (t) => {
    const data = [1, 2, 3, 4, 5, 6, 7];

    return new Promise((resolve, reject) => {
        fromArray([...data])
            .pipe(batch(3))
            .pipe(
                map((d) => {
                    t.deepEqual(
                        d,
                        [data.shift(), data.shift(), data.shift()].filter(
                            (x) => !!x,
                        ),
                    );
                }),
            )
            .on("error", reject)
            .on("finish", () => {
                t.is(data.length, 0);
                resolve();
            });
    });
});
