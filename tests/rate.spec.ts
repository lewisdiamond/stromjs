import { Readable } from "stream";
import { performance } from "perf_hooks";
import test from "ava";
import { rate } from "../src";
import { sleep } from "../src/helpers";

test.cb("rate() sends data at a rate of 150", t => {
    t.plan(15);
    const targetRate = 150;
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c", "d", "e"];
    const start = performance.now();
    let i = 0;

    source
        .pipe(rate(targetRate))
        .on("data", (element: string) => {
            const currentRate = (i / (performance.now() - start)) * 1000;
            t.is(element, expectedElements[i]);
            t.true(currentRate <= targetRate);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push("d");
    source.push("e");
    source.push(null);
});

test.cb("rate() sends data at a rate of 50", t => {
    t.plan(15);
    const targetRate = 50;
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c", "d", "e"];
    const start = performance.now();
    let i = 0;

    source
        .pipe(rate(targetRate))
        .on("data", (element: string) => {
            const currentRate = (i / (performance.now() - start)) * 1000;
            t.is(element, expectedElements[i]);
            t.true(currentRate <= targetRate);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push("d");
    source.push("e");
    source.push(null);
});

test.cb("rate() sends data at a rate of 1", t => {
    t.plan(15);
    const targetRate = 1;
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c", "d", "e"];
    const start = performance.now();
    let i = 0;

    source
        .pipe(rate(targetRate))
        .on("data", (element: string) => {
            const currentRate = (i / (performance.now() - start)) * 1000;
            t.is(element, expectedElements[i]);
            t.true(currentRate <= targetRate);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push("d");
    source.push("e");
    source.push(null);
});

test("rate() sends data at a rate of 1 and drops extra messages", async t => {
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
