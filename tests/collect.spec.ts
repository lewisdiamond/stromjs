import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { strom } from "../src";
const { collect } = strom();

test.cb(
    "collect() collects streamed elements into an array (object, flowing mode)",
    t => {
        t.plan(1);
        const source = new Readable({ objectMode: true });

        source
            .pipe(collect({ objectMode: true }))
            .on("data", collected => {
                expect(collected).to.deep.equal(["a", "b", "c"]);
                t.pass();
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    },
);

test.cb(
    "collect() collects streamed elements into an array (object, paused mode)",
    t => {
        t.plan(1);
        const source = new Readable({ objectMode: true });
        const collector = source.pipe(collect({ objectMode: true }));

        collector
            .on("readable", () => {
                let collected = collector.read();
                while (collected !== null) {
                    expect(collected).to.deep.equal(["a", "b", "c"]);
                    t.pass();
                    collected = collector.read();
                }
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    },
);

test.cb(
    "collect() collects streamed bytes into a buffer (non-object, flowing mode)",
    t => {
        t.plan(1);
        const source = new Readable({ objectMode: false });

        source
            .pipe(collect({ objectMode: false }))
            .on("data", collected => {
                expect(collected).to.deep.equal(Buffer.from("abc"));
                t.pass();
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    },
);

test.cb(
    "collect() collects streamed bytes into a buffer (non-object, paused mode)",
    t => {
        t.plan(1);
        const source = new Readable({ objectMode: false });
        const collector = source.pipe(collect({ objectMode: false }));
        collector
            .on("readable", () => {
                let collected = collector.read();
                while (collected !== null) {
                    expect(collected).to.deep.equal(Buffer.from("abc"));
                    t.pass();
                    collected = collector.read();
                }
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    },
);

test.cb(
    "collect() emits an empty array if the source was empty (object mode)",
    t => {
        t.plan(1);
        const source = new Readable({ objectMode: true });
        const collector = source.pipe(collect({ objectMode: true }));
        collector
            .on("data", collected => {
                expect(collected).to.deep.equal([]);
                t.pass();
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push(null);
    },
);

test.cb(
    "collect() emits nothing if the source was empty (non-object mode)",
    t => {
        t.plan(0);
        const source = new Readable({ objectMode: false });
        const collector = source.pipe(collect({ objectMode: false }));
        collector
            .on("data", () => t.fail())
            .on("error", t.end)
            .on("end", t.end);

        source.push(null);
    },
);
