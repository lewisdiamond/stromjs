import test from "ava";
import { expect } from "chai";
import { Readable } from "stream";
import { strom } from "../src";
const { filter } = strom();

test.cb("filter() filters elements synchronously", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "c"];
    let i = 0;
    source
        .pipe(
            filter((element: string) => element !== "b", {
                readableObjectMode: true,
                writableObjectMode: true,
            }),
        )
        .on("data", (element: string) => {
            expect(element).to.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("filter() filters elements asynchronously", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "c"];
    let i = 0;
    source
        .pipe(
            filter(
                async (element: string) => {
                    await Promise.resolve();
                    return element !== "b";
                },
                { readableObjectMode: true, writableObjectMode: true },
            ),
        )
        .on("data", (element: string) => {
            expect(element).to.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb.skip("filter() emits errors during synchronous filtering", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    source
        .pipe(
            filter(
                (element: string) => {
                    if (element !== "a") {
                        throw new Error("Failed filtering");
                    }
                    return true;
                },
                { readableObjectMode: true, writableObjectMode: true },
            ),
        )
        .resume()
        .on("error", err => {
            expect(err.message).to.equal("Failed filtering");
            t.pass();
        })
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb.skip("filter() emits errors during asynchronous filtering", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    source
        .pipe(
            filter(
                async (element: string) => {
                    await Promise.resolve();
                    if (element !== "a") {
                        throw new Error("Failed filtering");
                    }
                    return true;
                },
                { readableObjectMode: true, writableObjectMode: true },
            ),
        )
        .resume()
        .on("error", err => {
            expect(err.message).to.equal("Failed filtering");
            t.pass();
        })
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});
