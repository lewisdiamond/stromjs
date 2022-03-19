import { Readable, finished } from "stream";
import test from "ava";
import { expect } from "chai";
import { parse } from "../src";

test("parse() parses the streamed elements as JSON", (t) => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["abc", {}, []];
    let i = 0;
    return new Promise((resolve, reject) => {
        source
            .pipe(parse())
            .on("data", (part) => {
                expect(part).to.deep.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", reject)
            .on("end", resolve);

        source.push('"abc"');
        source.push("{}");
        source.push("[]");
        source.push(null);
    });
});

test("parse() emits errors on invalid JSON", (t) => {
    t.plan(1);
    const source = new Readable({ objectMode: true });

    return new Promise((resolve, reject) => {
        source
            .pipe(parse())
            .resume()
            .on("error", (d: any) => {
                t.pass();
                resolve();
            })
            .on("end", reject);

        source.push("{}");
        source.push({});
        source.push([]);
        source.push(null);
    });
});
