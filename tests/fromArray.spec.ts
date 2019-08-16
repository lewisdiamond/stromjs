import test from "ava";
import { expect } from "chai";
import { fromArray } from "../src";

test.cb("fromArray() streams array elements in flowing mode", t => {
    t.plan(3);
    const elements = ["a", "b", "c"];
    const stream = fromArray(elements);
    let i = 0;
    stream
        .on("data", (element: string) => {
            expect(element).to.equal(elements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);
});

test.cb("fromArray() ends immediately if there are no array elements", t => {
    t.plan(0);
    fromArray([])
        .on("data", () => t.fail())
        .on("error", t.end)
        .on("end", t.end);
});

test.cb("fromArray() streams array elements in paused mode", t => {
    t.plan(3);
    const elements = ["a", "b", "c"];
    const stream = fromArray(elements);
    let i = 0;
    stream
        .on("readable", () => {
            let element = stream.read();
            while (element !== null) {
                expect(element).to.equal(elements[i]);
                t.pass();
                i++;
                element = stream.read();
            }
        })
        .on("error", t.end)
        .on("end", t.end);
});
