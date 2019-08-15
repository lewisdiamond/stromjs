import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { flatMap } from ".";

test.cb("flatMap() maps elements synchronously", t => {
    t.plan(6);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "A", "b", "B", "c", "C"];
    let i = 0;
    source
        .pipe(flatMap((element: string) => [element, element.toUpperCase()]))
        .on("data", (element: string) => {
            expect(element).to.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("flatMap() maps elements asynchronously", t => {
    t.plan(6);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "A", "b", "B", "c", "C"];
    let i = 0;
    source
        .pipe(
            flatMap(async (element: string) => {
                await Promise.resolve();
                return [element, element.toUpperCase()];
            }),
        )
        .on("data", (element: string) => {
            expect(element).to.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("flatMap() emits errors during synchronous mapping", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    source
        .pipe(
            flatMap((element: string) => {
                if (element !== "a") {
                    throw new Error("Failed mapping");
                }
                return [element, element.toUpperCase()];
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

test.cb("flatMap() emits errors during asynchronous mapping", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    source
        .pipe(
            flatMap(async (element: string) => {
                await Promise.resolve();
                if (element !== "a") {
                    throw new Error("Failed mapping");
                }
                return [element, element.toUpperCase()];
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
