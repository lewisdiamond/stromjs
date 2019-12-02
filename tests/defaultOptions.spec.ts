import { Readable } from "stream";
import test from "ava";
import mhysa from "../src";

const withDefaultOptions = mhysa({ objectMode: true });
const withoutOptions = mhysa();

test("Mhysa instances can have default options", t => {
    let batch = withDefaultOptions.batch();
    t.true(batch._readableState.objectMode);
    t.true(batch._writableState.objectMode);
    batch = withDefaultOptions.batch(3);
    t.true(batch._readableState.objectMode);
    t.true(batch._writableState.objectMode);
    batch = withDefaultOptions.batch(3, 1);
    t.true(batch._readableState.objectMode);
    t.true(batch._writableState.objectMode);
    batch = withDefaultOptions.batch(3, 1, { objectMode: false });
    t.false(batch._readableState.objectMode);
    t.false(batch._writableState.objectMode);
});
