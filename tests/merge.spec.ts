import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { merge } from "../src";

test("merge() merges multiple readable streams in chunk arrival order", (t) => {
    t.plan(6);
    const source1 = new Readable({ objectMode: true, read: () => ({}) });
    const source2 = new Readable({ objectMode: true, read: () => ({}) });
    const expectedElements = ["a", "d", "b", "e", "c", "f"];
    let i = 0;
    return new Promise((resolve, reject) => {
        merge(source1, source2)
            .on("data", (element: string) => {
                expect(element).to.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", reject)
            .on("end", resolve);

        source1.push("a");
        setTimeout(() => source2.push("d"), 10);
        setTimeout(() => source1.push("b"), 20);
        setTimeout(() => source2.push("e"), 30);
        setTimeout(() => source1.push("c"), 40);
        setTimeout(() => source2.push("f"), 50);
        setTimeout(() => source2.push(null), 60);
        setTimeout(() => source1.push(null), 70);
    });
});

test("merge() merges a readable stream", (t) => {
    t.plan(3);
    const source = new Readable({ objectMode: true, read: () => ({}) });
    const expectedElements = ["a", "b", "c"];
    let i = 0;
    return new Promise((resolve, reject) => {
        merge(source)
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

test("merge() merges an empty list of readable streams", (t) => {
    t.plan(0);
    return new Promise((resolve, reject) => {
        merge()
            .on("data", () => t.pass())
            .on("error", reject)
            .on("end", resolve);
    });
});
