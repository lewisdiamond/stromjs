import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { map } from "../src";

test("map() maps elements synchronously", (t) => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const mapStream = map((element: string) => element.toUpperCase(), {
        objectMode: true,
    });
    const expectedElements = ["A", "B", "C"];
    let i = 0;
    return new Promise((resolve, reject) => {
        source
            .pipe(mapStream)
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

test("map() maps elements asynchronously", (t) => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const mapStream = map(
        async (element: string) => {
            await Promise.resolve();
            return element.toUpperCase();
        },
        { objectMode: true },
    );
    const expectedElements = ["A", "B", "C"];
    let i = 0;
    return new Promise((resolve, reject) => {
        source
            .pipe(mapStream)
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
