import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { map } from ".";

test.cb("map() maps elements synchronously", t => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const mapStream = map((element: string) => element.toUpperCase());
    const expectedElements = ["A", "B", "C"];
    let i = 0;
    source
        .pipe(mapStream)
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
    const mapStream = map(async (element: string) => {
        await Promise.resolve();
        return element.toUpperCase();
    });
    const expectedElements = ["A", "B", "C"];
    let i = 0;
    source
        .pipe(mapStream)
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
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const mapStream = map((element: string) => {
        if (element !== "b") {
            throw new Error("Failed mapping");
        }
        return element.toUpperCase();
    });
    source
        .pipe(mapStream)
        .on("data", data => {
            expect(data).to.equal("B");
            t.pass();
        })
        .on("error", err => {
            source.pipe(mapStream);
            mapStream.resume();
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
    return new Promise((resolve, _) => {
        const source = new Readable({ objectMode: true });
        const mapStream = map(async (element: string) => {
            await Promise.resolve();
            if (element === "b") {
                throw new Error("Failed mapping");
            }
            return element.toUpperCase();
        });
        source
            .pipe(mapStream)
            .on("error", err => {
                expect(err.message).to.equal("Failed mapping");
                t.pass();
                resolve();
            })
            .on("end", () => t.fail);

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
        source.push(null);
        source.push(null);
    });
});
