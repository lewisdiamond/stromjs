import { Readable } from "stream";
import { performance } from "perf_hooks";
import test from "ava";
import { expect } from "chai";
import { strom } from "../src";
const { rate } = strom({ objectMode: true });

test.cb("rate() sends data at a rate of 150", t => {
    t.plan(5);
    const targetRate = 150;
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c", "d", "e"];
    const start = performance.now();
    let i = 0;

    source
        .pipe(rate(targetRate))
        .on("data", (element: string[]) => {
            const currentRate = (i / (performance.now() - start)) * 1000;
            expect(element).to.deep.equal(expectedElements[i]);
            expect(currentRate).lessThan(targetRate);
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
    t.plan(5);
    const targetRate = 50;
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c", "d", "e"];
    const start = performance.now();
    let i = 0;

    source
        .pipe(rate(targetRate))
        .on("data", (element: string[]) => {
            const currentRate = (i / (performance.now() - start)) * 1000;
            expect(element).to.deep.equal(expectedElements[i]);
            expect(currentRate).lessThan(targetRate);
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
    t.plan(5);
    const targetRate = 1;
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c", "d", "e"];
    const start = performance.now();
    let i = 0;

    source
        .pipe(rate(targetRate))
        .on("data", (element: string[]) => {
            const currentRate = (i / (performance.now() - start)) * 1000;
            expect(element).to.deep.equal(expectedElements[i]);
            expect(currentRate).lessThan(targetRate);
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
