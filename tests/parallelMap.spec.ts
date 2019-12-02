import { Readable } from "stream";
import { performance } from "perf_hooks";
import test from "ava";
import { expect } from "chai";
import mhysa from "../src";
import { sleep } from "../src/helpers";
const { parallelMap } = mhysa({ objectMode: true });

test.cb("parallelMap() parallel mapping", t => {
    t.plan(6);
    const offset = 50;
    const source = new Readable({ objectMode: true });
    const expectedElements = [
        "a_processed",
        "b_processed",
        "c_processed",
        "d_processed",
        "e_processed",
        "f_processed",
    ];
    interface IPerfData {
        start: number;
        output?: string;
        finish?: number;
    }
    const orderedResults: IPerfData[] = [];
    source
        .pipe(
            parallelMap(async (data: any) => {
                const perfData: IPerfData = { start: performance.now() };
                const c = data + "_processed";
                perfData.output = c;
                await sleep(offset);
                perfData.finish = performance.now();
                orderedResults.push(perfData);
                return c;
            }, 2),
        )
        .on("data", (element: string) => {
            t.true(expectedElements.includes(element));
        })
        .on("error", t.end)
        .on("end", async () => {
            expect(orderedResults[0].finish).to.be.lessThan(
                orderedResults[2].start,
            );
            expect(orderedResults[1].finish).to.be.lessThan(
                orderedResults[3].start,
            );
            expect(orderedResults[2].finish).to.be.lessThan(
                orderedResults[4].start,
            );
            expect(orderedResults[3].finish).to.be.lessThan(
                orderedResults[5].start,
            );
            expect(orderedResults[0].start).to.be.lessThan(
                orderedResults[2].start + offset,
            );
            expect(orderedResults[1].start).to.be.lessThan(
                orderedResults[3].start + offset,
            );
            expect(orderedResults[2].start).to.be.lessThan(
                orderedResults[4].start + offset,
            );
            expect(orderedResults[3].start).to.be.lessThan(
                orderedResults[5].start + offset,
            );
            t.end();
        });

    source.push("a");
    source.push("b");
    source.push("c");
    source.push("d");
    source.push("e");
    source.push("f");
    source.push(null);
});
