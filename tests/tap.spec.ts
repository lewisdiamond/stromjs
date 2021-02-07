import test from "ava";
import { expect } from "chai";
import { fromArray, tap } from "../src";

test.cb("tap() can see every chunk", t => {
    t.plan(12);
    const data = [1,2,3,4,5,6];
    let d1 = 1;
    let d2 = 1;
    fromArray(data).pipe(tap((c) => {
        t.is(d1++,c);
    })).pipe(tap((c) => {
        t.is(d2++,c);
    })).on('finish', t.end);
});

