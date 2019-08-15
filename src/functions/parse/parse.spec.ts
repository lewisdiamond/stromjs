import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { parse } from "../baseFunctions";

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
    t.plan(2);
    const source = new Readable({ objectMode: true });
    source
        .pipe(parse())
        .resume()
        .on("error", () => t.pass())
        .on("end", t.end);

    source.push("{}");
    source.push({});
    source.push([]);
    source.push(null);
});
