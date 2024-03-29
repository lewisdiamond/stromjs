import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { stringify } from "../src";

test("stringify() stringifies the streamed elements as JSON", (t) => {
    t.plan(4);
    const source = new Readable({ objectMode: true });
    const expectedElements = [
        '"abc"',
        "0",
        '{"a":"a","b":"b","c":"c"}',
        '["a","b","c"]',
    ];
    let i = 0;
    return new Promise((resolve, reject) => {
        source
            .pipe(stringify())
            .on("data", (part) => {
                expect(part).to.deep.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", reject)
            .on("end", resolve);

        source.push("abc");
        source.push(0);
        source.push({ a: "a", b: "b", c: "c" });
        source.push(["a", "b", "c"]);
        source.push(null);
    });
});

test("stringify() stringifies the streamed elements as pretty-printed JSON", (t) => {
    t.plan(4);
    const source = new Readable({ objectMode: true });
    const expectedElements = [
        '"abc"',
        "0",
        '{\n  "a": "a",\n  "b": "b",\n  "c": "c"\n}',
        '[\n  "a",\n  "b",\n  "c"\n]',
    ];
    let i = 0;
    return new Promise((resolve, reject) => {
        source
            .pipe(stringify({ pretty: true }))
            .on("data", (part) => {
                expect(part).to.deep.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", reject)
            .on("end", resolve);

        source.push("abc");
        source.push(0);
        source.push({ a: "a", b: "b", c: "c" });
        source.push(["a", "b", "c"]);
        source.push(null);
    });
});
