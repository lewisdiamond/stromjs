import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { collect } from "../src";

test("collect() collects streamed elements into an array (object, flowing mode)", (t) => {
    t.plan(1);
    const source = new Readable({ objectMode: true, read: () => {} });
    return new Promise((resolve, reject) => {
        source
            .pipe(collect({ objectMode: true }))
            .on("data", (collected) => {
                expect(collected).to.deep.equal(["a", "b", "c"]);
                t.pass();
            })
            .on("error", reject)
            .on("end", resolve);

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    });
});

test("collect() collects streamed elements into an array (object, paused mode)", (t) => {
    t.plan(1);
    const source = new Readable({ objectMode: true, read: () => {} });
    const collector = source.pipe(collect({ objectMode: true }));

    return new Promise((resolve, reject) => {
        collector
            .on("data", (collected) => {
                expect(collected).to.deep.equal(["a", "b", "c"]);
                t.pass();
            })
            .on("error", reject)
            .on("end", resolve);
        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    });
});

test("collect() collects streamed bytes into a buffer (non-object, flowing mode)", (t) => {
    t.plan(1);
    const source = new Readable({ objectMode: false, read: () => {} });

    return new Promise((resolve, reject) => {
        source
            .pipe(collect({ objectMode: false }))
            .on("data", (collected) => {
                expect(collected).to.deep.equal(Buffer.from("abc"));
                t.pass();
            })
            .on("error", reject)
            .on("end", resolve);

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    });
});

test("collect() collects streamed bytes into a buffer (non-object, paused mode)", (t) => {
    t.plan(1);
    const source = new Readable({ objectMode: false, read: () => {} });
    const collector = source.pipe(collect({ objectMode: false }));
    return new Promise((resolve, reject) => {
        collector
            .on("data", (collected) => {
                expect(collected).to.deep.equal(Buffer.from("abc"));
                t.pass();
            })
            .on("error", reject)
            .on("end", resolve);

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    });
});

test("collect() emits an empty array if the source was empty (object mode)", (t) => {
    t.plan(1);
    const source = new Readable({ objectMode: true, read: function () {} });
    const collector = source.pipe(collect({ objectMode: true }));
    return new Promise((resolve, reject) => {
        collector
            .on("data", (collected) => {
                expect(collected).to.deep.equal([]);
                t.pass();
            })
            .on("error", reject)
            .on("end", resolve);

        source.push(null);
    });
});

test("collect() emits nothing if the source was empty (non-object mode)", (t) => {
    t.plan(0);
    const source = new Readable({ objectMode: false, read: function () {} });
    const collector = source.pipe(collect({ objectMode: false }));
    return new Promise((resolve, reject) => {
        collector
            .on("data", () => t.fail())
            .on("error", reject)
            .on("end", resolve);

        source.push(null);
    });
});
