import { Readable, finished } from "stream";
import test from "ava";
import { expect } from "chai";
import { strom } from "../src";
const { parse } = strom();

test.cb("parse() parses the streamed elements as JSON", t => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["abc", {}, []];
    let i = 0;
    source
        .pipe(parse())
        .on("data", part => {
            expect(part).to.deep.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push('"abc"');
    source.push("{}");
    source.push("[]");
    source.push(null);
});

test.cb("parse() emits errors on invalid JSON", t => {
    t.plan(1);
    const source = new Readable({ objectMode: true });

    source
        .pipe(parse())
        .resume()
        .on("error", (d: any) => {
            t.pass();
            t.end();
        })
        .on("end", t.fail);

    source.push("{}");
    source.push({});
    source.push([]);
    source.push(null);
});
