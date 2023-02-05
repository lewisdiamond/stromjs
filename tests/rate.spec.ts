import { Readable } from "stream";
import { performance } from "perf_hooks";
import test from "ava";
import { rate } from "../src";
import { sleep } from "../src/helpers";

test("rate() sends data at a rate of 1, 50, 150", (t) => {
    const rates = [
        [150, 0.1],
        [50, 0.1],
        [1, 0.05],
    ];
    t.plan(15 * rates.length);
    const promises = rates.map(([targetRate, delta]) => {
        const source = new Readable({ objectMode: true });
        const expectedElements = ["a", "b", "c", "d", "e"];
        const start = performance.now();
        let i = 0;

        return new Promise((resolve, reject) => {
            source
                .pipe(rate(targetRate))
                .on("data", (element: string) => {
                    const currentRate =
                        (i / (performance.now() - start)) * 1000;
                    t.is(element, expectedElements[i]);
                    t.true(currentRate <= targetRate + delta);
                    t.pass();
                    i++;
                })
                .on("error", reject)
                .on("end", resolve);

            source.push("a");
            source.push("b");
            source.push("c");
            source.push("d");
            source.push("e");
            source.push(null);
        });
    });
    return Promise.all(promises);
});

test("rate() sends data at a rate of 1 and drops extra messages", async (t) => {
    t.plan(9);
    const targetRate = 1;
    const source = new Readable({
        objectMode: true,
        read: () => {
            return;
        },
    });
    const expectedElements = ["a", "b", "e"];
    const start = performance.now();
    let i = 0;

    let plan = 0;
    source
        .pipe(rate(targetRate, 1, { behavior: 1 }))
        .on("data", (element: string) => {
            const currentRate = (i / (performance.now() - start)) * 1000;
            t.is(element, expectedElements[i]);
            t.true(currentRate <= targetRate);
            plan++;
            t.pass();
            i++;
        })
        .on("error", t.fail)
        .on("end", t.fail);

    source.push("a");
    await sleep(1000);
    source.push("b");
    source.push("c");
    source.push("d");
    await sleep(1000);
    source.push("e");
    await sleep(1000);
    source.push(null);
});
