import { Readable } from "stream";
import { performance } from "perf_hooks";
import test from "ava";
import { expect } from "chai";
import { rate } from "../src";

test.cb("rate() sends data at desired rate", t => {
    t.plan(9);
    const fastRate = 150;
    const medRate = 50;
    const slowRate = 1;
    const sourceFast = new Readable({ objectMode: true });
    const sourceMed = new Readable({ objectMode: true });
    const sourceSlow = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c"];
    const start = performance.now();
    let i = 0;
    let j = 0;
    let k = 0;

    sourceFast
        .pipe(rate(fastRate, 1))
        .on("data", (element: string[]) => {
            const currentRate = (i / (performance.now() - start)) * 1000;
            expect(element).to.deep.equal(expectedElements[i]);
            expect(currentRate).lessThan(fastRate);
            t.pass();
            i++;
        })
        .on("error", t.end);

    sourceMed
        .pipe(rate(medRate, 1))
        .on("data", (element: string[]) => {
            const currentRate = (j / (performance.now() - start)) * 1000;
            expect(element).to.deep.equal(expectedElements[j]);
            expect(currentRate).lessThan(medRate);
            t.pass();
            j++;
        })
        .on("error", t.end);

    sourceSlow
        .pipe(rate(slowRate, 1))
        .on("data", (element: string[]) => {
            const currentRate = (k / (performance.now() - start)) * 1000;
            expect(element).to.deep.equal(expectedElements[k]);
            expect(currentRate).lessThan(slowRate);
            t.pass();
            k++;
        })
        .on("error", t.end)
        .on("end", t.end);

    sourceFast.push("a");
    sourceFast.push("b");
    sourceFast.push("c");
    sourceFast.push(null);
    sourceMed.push("a");
    sourceMed.push("b");
    sourceMed.push("c");
    sourceMed.push(null);
    sourceSlow.push("a");
    sourceSlow.push("b");
    sourceSlow.push("c");
    sourceSlow.push(null);
});
