import { Readable } from "stream";
import test from "ava";
import { batch as _batch, instance as strom } from "../src";

const withDefaultOptions = strom({ objectMode: false });

test("strom instances can have default options", t => {
    let batch = withDefaultOptions.batch();
    t.false(batch._readableState.objectMode);
    t.false(batch._writableState.objectMode);
    batch = withDefaultOptions.batch(3);
    t.false(batch._readableState.objectMode);
    t.false(batch._writableState.objectMode);
    batch = withDefaultOptions.batch(3, 1);
    t.false(batch._readableState.objectMode);
    t.false(batch._writableState.objectMode);
    batch = withDefaultOptions.batch(3, 1, { objectMode: true });
    t.true(batch._readableState.objectMode);
    t.true(batch._writableState.objectMode);

    batch = _batch(3);
    t.true(batch._readableState.objectMode);
    t.true(batch._writableState.objectMode);
    batch = _batch(3, 1);
    t.true(batch._readableState.objectMode);
    t.true(batch._writableState.objectMode);
    batch = _batch(3, 1, { objectMode: false });
    t.false(batch._readableState.objectMode);
    t.false(batch._writableState.objectMode);
});
