import test from "ava";
import { expect } from "chai";
import { Readable } from "stream";
import { accumulator, accumulatorBy } from ".";
import { FlushStrategy } from "./definitions";

test.cb("accumulator() rolling", t => {
    t.plan(3);
    let chunkIndex = 0;
    interface TestObject {
        ts: number;
        key: string;
    }
    const source = new Readable({ objectMode: true });
    const firstFlush = [{ ts: 0, key: "a" }, { ts: 1, key: "b" }];
    const secondFlush = [{ ts: 2, key: "d" }, { ts: 3, key: "e" }];
    const thirdFlush = [{ ts: 4, key: "f" }];
    const flushes = [firstFlush, secondFlush, thirdFlush];

    source
        .pipe(accumulator(2, undefined, FlushStrategy.rolling))
        .on("data", (flush: TestObject[]) => {
            t.deepEqual(flush, flushes[chunkIndex]);
            chunkIndex++;
        })
        .on("error", (e: any) => {
            t.end(e);
        })
        .on("end", () => {
            t.end();
        });
    [...firstFlush, ...secondFlush, ...thirdFlush].forEach(item => {
        source.push(item);
    });
    source.push(null);
});

test.cb("accumulator() rolling with key", t => {
    t.plan(2);
    let chunkIndex = 0;
    interface TestObject {
        ts: number;
        key: string;
    }
    const source = new Readable({ objectMode: true });
    const firstFlush = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
        { ts: 2, key: "d" },
    ];
    const secondFlush = [{ ts: 3, key: "e" }];
    const flushes = [firstFlush, secondFlush];

    source
        .pipe(accumulator(3, undefined, FlushStrategy.rolling, "ts"))
        .on("data", (flush: TestObject[]) => {
            t.deepEqual(flush, flushes[chunkIndex]);
            chunkIndex++;
        })
        .on("error", (e: any) => {
            t.end(e);
        })
        .on("end", () => {
            t.end();
        });
    [...firstFlush, ...secondFlush].forEach(item => {
        source.push(item);
    });
    source.push(null);
});

test.cb("accumulatorBy() rolling", t => {
    t.plan(2);
    let chunkIndex = 0;
    interface TestObject {
        ts: number;
        key: string;
    }
    const source = new Readable({ objectMode: true });
    const firstFlush = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
        { ts: 2, key: "d" },
    ];
    const secondFlush = [{ ts: 3, key: "e" }];
    const flushes = [firstFlush, secondFlush];

    source
        .pipe(
            accumulatorBy(
                undefined,
                FlushStrategy.rolling,
                (event: TestObject, bufferChunk: TestObject) => {
                    return bufferChunk.ts + 3 <= event.ts;
                },
            ),
        )
        .on("data", (flush: TestObject[]) => {
            t.deepEqual(flush, flushes[chunkIndex]);
            chunkIndex++;
        })
        .on("error", (e: any) => {
            t.end(e);
        })
        .on("end", () => {
            t.end();
        });
    [...firstFlush, ...secondFlush].forEach(item => {
        source.push(item);
    });
    source.push(null);
});

test.cb("accumulator() sliding", t => {
    t.plan(4);
    let chunkIndex = 0;
    interface TestObject {
        ts: number;
        key: string;
    }
    const source = new Readable({ objectMode: true });
    const input = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
        { ts: 4, key: "d" },
    ];
    const firstFlush = [{ ts: 0, key: "a" }];
    const secondFlush = [{ ts: 0, key: "a" }, { ts: 1, key: "b" }];
    const thirdFlush = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
    ];
    const fourthFlush = [
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
        { ts: 4, key: "d" },
    ];

    const flushes = [firstFlush, secondFlush, thirdFlush, fourthFlush];
    source
        .pipe(accumulator(3, undefined, FlushStrategy.sliding))
        .on("data", (flush: TestObject[]) => {
            t.deepEqual(flush, flushes[chunkIndex]);
            chunkIndex++;
        })
        .on("error", (e: any) => {
            t.end(e);
        })
        .on("end", () => {
            t.end();
        });
    input.forEach(item => {
        source.push(item);
    });
    source.push(null);
});

test.cb("accumulator() sliding with key", t => {
    t.plan(6);
    let chunkIndex = 0;
    interface TestObject {
        ts: number;
        key: string;
    }
    const source = new Readable({ objectMode: true });
    const input = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
        { ts: 3, key: "d" },
        { ts: 5, key: "f" },
        { ts: 6, key: "g" },
    ];
    const firstFlush = [{ ts: 0, key: "a" }];
    const secondFlush = [{ ts: 0, key: "a" }, { ts: 1, key: "b" }];
    const thirdFlush = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
    ];
    const fourthFlush = [
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
        { ts: 3, key: "d" },
    ];
    const fifthFlush = [{ ts: 3, key: "d" }, { ts: 5, key: "f" }];
    const sixthFlush = [{ ts: 5, key: "f" }, { ts: 6, key: "g" }];

    const flushes = [
        firstFlush,
        secondFlush,
        thirdFlush,
        fourthFlush,
        fifthFlush,
        sixthFlush,
    ];
    source
        .pipe(accumulator(3, undefined, FlushStrategy.sliding, "ts"))
        .on("data", (flush: TestObject[]) => {
            t.deepEqual(flush, flushes[chunkIndex]);
            chunkIndex++;
        })
        .on("error", (e: any) => {
            t.end(e);
        })
        .on("end", () => {
            t.end();
        });
    input.forEach(item => {
        source.push(item);
    });
    source.push(null);
});

test.cb("accumulatorBy() sliding", t => {
    t.plan(6);
    let chunkIndex = 0;
    interface TestObject {
        ts: number;
        key: string;
    }
    const source = new Readable({ objectMode: true });
    const input = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
        { ts: 3, key: "d" },
        { ts: 5, key: "f" },
        { ts: 6, key: "g" },
    ];
    const firstFlush = [{ ts: 0, key: "a" }];
    const secondFlush = [{ ts: 0, key: "a" }, { ts: 1, key: "b" }];
    const thirdFlush = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
    ];
    const fourthFlush = [
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
        { ts: 3, key: "d" },
    ];
    const fifthFlush = [{ ts: 3, key: "d" }, { ts: 5, key: "f" }];
    const sixthFlush = [{ ts: 5, key: "f" }, { ts: 6, key: "g" }];

    const flushes = [
        firstFlush,
        secondFlush,
        thirdFlush,
        fourthFlush,
        fifthFlush,
        sixthFlush,
    ];
    source
        .pipe(
            accumulatorBy(
                undefined,
                FlushStrategy.sliding,
                (event: TestObject, bufferChunk: TestObject) => {
                    return bufferChunk.ts + 3 <= event.ts ? true : false;
                },
            ),
        )
        .on("data", (flush: TestObject[]) => {
            t.deepEqual(flush, flushes[chunkIndex]);
            chunkIndex++;
        })
        .on("error", (e: any) => {
            t.end(e);
        })
        .on("end", () => {
            t.end();
        });
    input.forEach(item => {
        source.push(item);
    });
    source.push(null);
});

test.cb.only("accumulatorBy() sliding should throw", t => {
    t.plan(2);
    interface TestObject {
        ts: number;
        key: string;
    }
    const source = new Readable({ objectMode: true });
    const input = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
        { ts: 3, key: "d" },
    ];
    const accumulaterStream = accumulatorBy(
        undefined,
        FlushStrategy.sliding,
        (event: TestObject, bufferChunk: TestObject) => {
            if (event.key !== "a" && event.key !== "b") {
                throw new Error("Failed mapping");
            }
            return bufferChunk.ts + 3 <= event.ts ? true : false;
        },
    );
    source
        .pipe(accumulaterStream)
        .on("error", (err: any) => {
            source.pipe(accumulaterStream);
            accumulaterStream.resume();
            expect(err.message).to.equal("Failed mapping");
            t.pass();
        })
        .on("end", () => {
            t.end();
        });

    input.forEach(item => {
        source.push(item);
    });
    source.push(null);
});
