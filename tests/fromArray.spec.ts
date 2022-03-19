import test from "ava";
import { expect } from "chai";
import { fromArray } from "../src";

test("fromArray() streams array elements in flowing mode", (t) => {
    t.plan(3);
    const elements = ["a", "b", "c"];
    const stream = fromArray(elements);
    let i = 0;
    return new Promise((resolve, reject) => {
        stream
            .on("data", (element: string) => {
                expect(element).to.equal(elements[i]);
                t.pass();
                i++;
            })
            .on("error", reject)
            .on("end", resolve);
    });
});

test("fromArray() ends immediately if there are no array elements", (t) => {
    t.plan(0);
    return new Promise((resolve, reject) => {
        fromArray([])
            .on("data", () => t.fail())
            .on("error", reject)
            .on("end", resolve);
    });
});

test("fromArray() streams array elements in paused mode", (t) => {
    t.plan(3);
    const elements = ["a", "b", "c"];
    const stream = fromArray(elements);
    let i = 0;
    return new Promise((resolve, reject) => {
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
            .on("error", reject)
            .on("end", resolve);
    });
});
