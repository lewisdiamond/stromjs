import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { last } from "../baseFunctions";

test("last() resolves to the last chunk streamed by the given readable stream", async t => {
    const source = new Readable({ objectMode: true });
    const lastPromise = last(source);
    source.push("ab");
    source.push("cd");
    source.push("ef");
    source.push(null);
    const lastChunk = await lastPromise;
    expect(lastChunk).to.equal("ef");
});
