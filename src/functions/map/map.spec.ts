import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { map } from ".";

test.cb("map() maps elements synchronously", t => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["A", "B", "C"];
    let i = 0;
    source
        .pipe(map((element: string) => element.toUpperCase()))
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

test.cb("map() maps elements asynchronously", t => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["A", "B", "C"];
    let i = 0;
    source
        .pipe(
            map(async (element: string) => {
                await Promise.resolve();
                return element.toUpperCase();
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

test.cb("map() emits errors during synchronous mapping", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    source
        .pipe(
            map((element: string) => {
                if (element !== "a") {
                    throw new Error("Failed mapping");
                }
                return element.toUpperCase();
            }),
        )
        .resume()
        .on("error", err => {
            expect(err.message).to.equal("Failed mapping");
            t.pass();
        })
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test("map() emits errors during asynchronous mapping", t => {
    t.plan(1);
    return new Promise((resolve, reject) => {
        const source = new Readable({ objectMode: true });
        source
            .pipe(
                map(async (element: string) => {
                    await Promise.resolve();
                    if (element !== "a") {
                        throw new Error("Failed mapping");
                    }
                    return element.toUpperCase();
                }),
            )
            .resume()
            .on("error", err => {
                expect(err.message).to.equal("Failed mapping");
                t.pass();
                resolve();
            })
            .on("end", () => {
                t.fail();
            });

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    });
});
