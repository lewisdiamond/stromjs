import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { concat, collect } from "../src";

test("concat() concatenates multiple readable streams (object, flowing mode)", (t) => {
    t.plan(6);
    const source1 = new Readable({ objectMode: true });
    const source2 = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c", "d", "e", "f"];
    let i = 0;
    return new Promise((resolve, reject) => {
        concat(source1, source2)
            .on("data", (element: string) => {
                expect(element).to.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", reject)
            .on("end", resolve);

        source1.push("a");
        source2.push("d");
        source1.push("b");
        source2.push("e");
        source1.push("c");
        source2.push("f");
        source2.push(null);
        source1.push(null);
    });
});

test("concat() concatenates multiple readable streams (object, paused mode)", (t) => {
    t.plan(6);
    const source1 = new Readable({ objectMode: true });
    const source2 = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c", "d", "e", "f"];
    let i = 0;

    return new Promise((resolve, reject) => {
        const concatenation = concat(source1, source2)
            .on("readable", () => {
                let element = concatenation.read();
                while (element !== null) {
                    expect(element).to.equal(expectedElements[i]);
                    t.pass();
                    i++;
                    element = concatenation.read();
                }
            })
            .on("error", reject)
            .on("end", resolve);

        source1.push("a");
        source2.push("d");
        source1.push("b");
        source2.push("e");
        source1.push("c");
        source2.push("f");
        source2.push(null);
        source1.push(null);
    });
});

test("concat() concatenates multiple readable streams (non-object, flowing mode)", (t) => {
    t.plan(6);
    const source1 = new Readable({ objectMode: false });
    const source2 = new Readable({ objectMode: false });
    const expectedElements = ["a", "b", "c", "d", "e", "f"];
    let i = 0;
    return new Promise((resolve, reject) => {
        concat(source1, source2)
            .on("data", (element: string) => {
                expect(element).to.deep.equal(Buffer.from(expectedElements[i]));
                t.pass();
                i++;
            })
            .on("error", reject)
            .on("end", resolve);

        source1.push("a");
        source2.push("d");
        source1.push("b");
        source2.push("e");
        source1.push("c");
        source2.push("f");
        source2.push(null);
        source1.push(null);
    });
});

test("concat() concatenates multiple readable streams (non-object, paused mode)", (t) => {
    t.plan(6);
    const source1 = new Readable({ objectMode: false, read: () => ({}) });
    const source2 = new Readable({ objectMode: false, read: () => ({}) });
    const expectedElements = ["a", "b", "c", "d", "e", "f"];
    let i = 0;
    return new Promise((resolve, reject) => {
        const concatenation = concat(source1, source2)
            .on("readable", () => {
                let element = concatenation.read();
                while (element !== null) {
                    expect(element).to.deep.equal(
                        Buffer.from(expectedElements[i]),
                    );
                    t.pass();
                    i++;
                    element = concatenation.read();
                }
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

test("concat() concatenates a single readable stream (object mode)", (t) => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c", "d", "e", "f"];
    let i = 0;
    return new Promise((resolve, reject) => {
        concat(source)
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

test("concat() concatenates a single readable stream (non-object mode)", (t) => {
    t.plan(3);
    const source = new Readable({ objectMode: false });
    const expectedElements = ["a", "b", "c", "d", "e", "f"];
    let i = 0;
    return new Promise((resolve, reject) => {
        concat(source)
            .on("data", (element: string) => {
                expect(element).to.deep.equal(Buffer.from(expectedElements[i]));
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

test("concat() concatenates empty list of readable streams", (t) => {
    t.plan(0);
    return new Promise((resolve, reject) => {
        concat()
            .pipe(collect({ objectMode: false }))
            .on("data", (_) => {
                t.fail();
            })
            .on("error", reject)
            .on("end", resolve);
    });
});
