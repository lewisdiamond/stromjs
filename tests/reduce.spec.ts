import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { reduce } from "../src";

test("reduce() reduces elements synchronously", (t) => {
    t.plan(1);
    const source = new Readable({ objectMode: true });
    const expectedValue = 6;
    return new Promise((resolve, reject) => {
        source
            .pipe(
                reduce(
                    (acc: number, element: string) => acc + element.length,
                    0,
                ),
            )
            .on("data", (element: string) => {
                expect(element).to.equal(expectedValue);
                t.pass();
            })
            .on("error", reject)
            .on("end", resolve);

        source.push("ab");
        source.push("cd");
        source.push("ef");
        source.push(null);
    });
});

test("reduce() reduces elements asynchronously", (t) => {
    t.plan(1);
    const source = new Readable({ objectMode: true });
    const expectedValue = 6;
    return new Promise((resolve, reject) => {
        source
            .pipe(
                reduce(async (acc: number, element: string) => {
                    await Promise.resolve();
                    return acc + element.length;
                }, 0),
            )
            .on("data", (element: string) => {
                expect(element).to.equal(expectedValue);
                t.pass();
            })
            .on("error", reject)
            .on("end", resolve);

        source.push("ab");
        source.push("cd");
        source.push("ef");
        source.push(null);
    });
});

test("reduce() emits errors during synchronous reduce", (t) => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    return new Promise((resolve, reject) => {
        source
            .pipe(
                reduce((acc: number, element: string) => {
                    if (element !== "ab") {
                        throw new Error("Failed reduce");
                    }
                    return acc + element.length;
                }, 0),
            )
            .resume()
            .on("error", (err) => {
                expect(err.message).to.equal("Failed reduce");
                t.pass();
            })
            .on("close", () => {
                t.pass();
                resolve();
            });

        source.push("ab");
        source.push("cd");
        source.push("ef");
        source.push(null);
    });
});

test("reduce() emits errors during asynchronous reduce", (t) => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    return new Promise((resolve, reject) => {
        source
            .pipe(
                reduce(async (acc: number, element: string) => {
                    await Promise.resolve();
                    if (element !== "ab") {
                        throw new Error("Failed mapping");
                    }
                    return acc + element.length;
                }, 0),
            )
            .resume()
            .on("error", (err) => {
                expect(err.message).to.equal("Failed mapping");
                t.pass();
            })
            .on("close", () => {
                t.pass();
                resolve();
            });

        source.push("ab");
        source.push("cd");
        source.push("ef");
        source.push(null);
    });
});
