import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { strom } from "../src";
const { batch, map, fromArray } = strom({ objectMode: true });

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

test.cb(
    "batch() yields all input data even when the last element(s) dont make a full batch",
    t => {
        const data = [1, 2, 3, 4, 5, 6, 7];

        fromArray([...data])
            .pipe(batch(3))
            .pipe(
                map(d => {
                    t.deepEqual(
                        d,
                        [data.shift(), data.shift(), data.shift()].filter(
                            x => !!x,
                        ),
                    );
                }),
            )
            .on("error", t.fail)
            .on("finish", () => {
                t.is(data.length, 0);
                t.end();
            });
    },
);
