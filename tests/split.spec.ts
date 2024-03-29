import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { split } from "../src";

test("split() splits chunks using the default separator (\\n)", (t) => {
    t.plan(5);
    const source = new Readable({ objectMode: true });
    const expectedParts = ["ab", "c", "d", "ef", ""];
    let i = 0;
    return new Promise((resolve, reject) => {
        source
            .pipe(split())
            .on("data", (part) => {
                expect(part).to.equal(expectedParts[i]);
                t.pass();
                i++;
            })
            .on("error", reject)
            .on("end", resolve);

        source.push("ab\n");
        source.push("c");
        source.push("\n");
        source.push("d");
        source.push("\nef\n");
        source.push(null);
    });
});

test("split() splits chunks using the specified separator", (t) => {
    t.plan(6);
    const source = new Readable({ objectMode: true });
    const expectedParts = ["ab", "c", "d", "e", "f", ""];
    let i = 0;
    return new Promise((resolve, reject) => {
        source
            .pipe(split("|"))
            .on("data", (part: string) => {
                expect(part).to.equal(expectedParts[i]);
                t.pass();
                i++;
            })
            .on("error", reject)
            .on("end", resolve);

        source.push("ab|");
        source.push("c|d");
        source.push("|");
        source.push("e");
        source.push("|f|");
        source.push(null);
    });
});

test("split() splits utf8 encoded buffers using the specified separator", (t) => {
    t.plan(3);
    const expectedElements = ["a", "b", "c"];
    let i = 0;
    const through = split(",");
    const buf = Buffer.from("a,b,c");
    return new Promise((resolve, reject) => {
        through
            .on("data", (element) => {
                expect(element).to.equal(expectedElements[i]);
                i++;
                t.pass();
            })
            .on("error", reject)
            .on("end", resolve);

        for (let j = 0; j < buf.length; ++j) {
            through.write(buf.slice(j, j + 1));
        }
        through.end();
    });
});

test("split() splits utf8 encoded buffers with multi-byte characters using the specified separator", (t) => {
    t.plan(3);
    const expectedElements = ["一", "一", "一"];
    let i = 0;
    const through = split(",");
    const buf = Buffer.from("一,一,一"); // Those spaces are multi-byte utf8 characters (code: 4E00)
    return new Promise((resolve, reject) => {
        through
            .on("data", (element) => {
                expect(element).to.equal(expectedElements[i]);
                i++;
                t.pass();
            })
            .on("error", reject)
            .on("end", resolve);

        for (let j = 0; j < buf.length; ++j) {
            through.write(buf.slice(j, j + 1));
        }
        through.end();
    });
});
