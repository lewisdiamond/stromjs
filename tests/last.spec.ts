import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { last, map } from "../src";

test("last() resolves to the last chunk streamed by the given readable stream", async (t) => {
    const source = new Readable({ objectMode: true });
    const lastPromise = last(source);
    source.push("ab");
    source.push("cd");
    source.push("ef");
    source.push(null);
    const lastChunk = await lastPromise;
    expect(lastChunk).to.equal("ef");
});

test("last() rejects the promise if an error occurs in the stream", (t) => {
    const source = new Readable({ objectMode: true, read: () => {} });
    const out = map((x) => {
        throw x;
    });
    const lastPromise = last(source.pipe(out));
    source.push("ab");
    lastPromise
        .then(() => t.fail())
        .catch((e) => {
            expect(e).equal("ab");
        });
});
