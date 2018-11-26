import test from "ava";
import { expect } from "chai";
import { Readable } from "stream";
import { fromArray, collect, concat } from "./stream";

test.cb("fromArray() streams array elements in flowing mode", t => {
    t.plan(3);
    const elements = ["a", "b", "c"];
    const stream = fromArray(elements);
    let i = 0;
    stream
        .on("data", element => {
            expect(element).to.equal(elements[i]);
            t.pass();
            i++;
        })
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

test.cb("fromArray() ends immediately if there are no array elements", t => {
    t.plan(0);
    fromArray([])
        .on("data", () => t.fail())
        .on("error", t.end)
        .on("end", t.end);
});

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
            .pipe(collect())
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

test.cb(
    "concat() concatenates multiple readable streams (object, flowing mode)",
    t => {
        t.plan(6);
        const source1 = new Readable({ objectMode: true });
        const source2 = new Readable({ objectMode: true });
        const expectedElements = ["a", "b", "c", "d", "e", "f"];
        let i = 0;
        concat(source1, source2)
            .on("data", element => {
                expect(element).to.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", t.end)
            .on("end", t.end);

        source1.push("a");
        source2.push("d");
        source1.push("b");
        source2.push("e");
        source1.push("c");
        source2.push("f");
        source2.push(null);
        source1.push(null);
    },
);

test.cb(
    "concat() concatenates multiple readable streams (object, paused mode)",
    t => {
        t.plan(6);
        const source1 = new Readable({ objectMode: true });
        const source2 = new Readable({ objectMode: true });
        const expectedElements = ["a", "b", "c", "d", "e", "f"];
        let i = 0;
        const concatenation = concat(source1, source2)
            .on("readable", () => {
                let element = concatenation.read();
                while (element !== null) {
                    expect(element).to.equal(expectedElements[i]);
                    t.pass();
                    i++;
                    element = concatenation.read();
                }
            })
            .on("error", t.end)
            .on("end", t.end);

        source1.push("a");
        source2.push("d");
        source1.push("b");
        source2.push("e");
        source1.push("c");
        source2.push("f");
        source2.push(null);
        source1.push(null);
    },
);

test.cb(
    "concat() concatenates multiple readable streams (non-object, flowing mode)",
    t => {
        t.plan(6);
        const source1 = new Readable({ objectMode: false });
        const source2 = new Readable({ objectMode: false });
        const expectedElements = ["a", "b", "c", "d", "e", "f"];
        let i = 0;
        concat(source1, source2)
            .on("data", element => {
                expect(element).to.deep.equal(Buffer.from(expectedElements[i]));
                t.pass();
                i++;
            })
            .on("error", t.end)
            .on("end", t.end);

        source1.push("a");
        source2.push("d");
        source1.push("b");
        source2.push("e");
        source1.push("c");
        source2.push("f");
        source2.push(null);
        source1.push(null);
    },
);

test.cb(
    "concat() concatenates multiple readable streams (non-object, paused mode)",
    t => {
        t.plan(6);
        const source1 = new Readable({ objectMode: false });
        const source2 = new Readable({ objectMode: false });
        const expectedElements = ["a", "b", "c", "d", "e", "f"];
        let i = 0;
        const concatenation = concat(source1, source2)
            .on("readable", () => {
                let element = concatenation.read();
                while (element !== null) {
                    expect(element).to.deep.equal(
                        Buffer.from(expectedElements[i]),
                    );
                    t.pass();
                    i++;
                    element = concatenation.read();
                }
            })
            .on("error", t.end)
            .on("end", t.end);

        source1.push("a");
        source2.push("d");
        source1.push("b");
        source2.push("e");
        source1.push("c");
        source2.push("f");
        source2.push(null);
        source1.push(null);
    },
);

test.cb("concat() concatenates a single readable stream (object mode)", t => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c", "d", "e", "f"];
    let i = 0;
    concat(source)
        .on("data", element => {
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

test.cb(
    "concat() concatenates a single readable stream (non-object mode)",
    t => {
        t.plan(3);
        const source = new Readable({ objectMode: false });
        const expectedElements = ["a", "b", "c", "d", "e", "f"];
        let i = 0;
        concat(source)
            .on("data", element => {
                expect(element).to.deep.equal(Buffer.from(expectedElements[i]));
                t.pass();
                i++;
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    },
);

test.cb("concat() concatenates empty list of readable streams", t => {
    t.plan(0);
    concat()
        .pipe(collect())
        .on("data", _ => {
            t.fail();
        })
        .on("error", t.end)
        .on("end", t.end);
});
