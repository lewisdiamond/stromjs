import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { replace } from "../src";

test.cb(
    "replace() replaces occurrences of the given string in the streamed elements with the specified " +
        "replacement string",
    t => {
        t.plan(3);
        const source = new Readable({ objectMode: true });
        const expectedElements = ["abc", "xyf", "ghi"];
        let i = 0;
        source
            .pipe(replace("de", "xy"))
            .on("data", part => {
                expect(part).to.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push("abc");
        source.push("def");
        source.push("ghi");
        source.push(null);
    },
);

test.cb(
    "replace() replaces occurrences of the given regular expression in the streamed elements with " +
        "the specified replacement string",
    t => {
        t.plan(3);
        const source = new Readable({ objectMode: true });
        const expectedElements = ["abc", "xyz", "ghi"];
        let i = 0;
        source
            .pipe(replace(/^def$/, "xyz"))
            .on("data", part => {
                expect(part).to.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push("abc");
        source.push("def");
        source.push("ghi");
        source.push(null);
    },
);

test.cb(
    "replace() replaces occurrences of the given multi-byte character even if it spans multiple chunks",
    t => {
        t.plan(3);
        const source = new Readable({ objectMode: true });
        const expectedElements = ["ø", "O", "a"];
        let i = 0;
        source
            .pipe(replace("ö", "O"))
            .on("data", part => {
                expect(part).to.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push(Buffer.from("ø").slice(0, 1)); // 2-byte character spanning two chunks
        source.push(Buffer.from("ø").slice(1, 2));
        source.push(Buffer.from("ö").slice(0, 1)); // 2-byte character spanning two chunks
        source.push(Buffer.from("ö").slice(1, 2));
        source.push("a");
        source.push(null);
    },
);
