import test from "ava";
import { expect } from "chai";
import { Readable } from "stream";
import { accumulator, accumulatorBy } from "../src";
import { FlushStrategy } from "../src/functions/accumulator";
import { performance } from "perf_hooks";

test("accumulator() rolling", (t) => {
    t.plan(3);
    let chunkIndex = 0;
    interface TestObject {
        ts: number;
        key: string;
    }
    const source = new Readable({ objectMode: true });
    const firstFlush = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
    ];
    const secondFlush = [
        { ts: 2, key: "d" },
        { ts: 3, key: "e" },
    ];
    const thirdFlush = [{ ts: 4, key: "f" }];
    const flushes = [firstFlush, secondFlush, thirdFlush];

    return new Promise((resolve, reject) => {
        source
            .pipe(
                accumulator(FlushStrategy.rolling, 2, undefined, {
                    objectMode: true,
                }),
            )
            .on("data", (flush: TestObject[]) => {
                t.deepEqual(flush, flushes[chunkIndex]);
                chunkIndex++;
            })
            .on("error", (e: any) => {
                reject(e);
            })
            .on("end", resolve);
        [...firstFlush, ...secondFlush, ...thirdFlush].forEach((item) => {
            source.push(item);
        });
        source.push(null);
    });
});

test("accumulator() rolling with key", (t) => {
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

    return new Promise((resolve, reject) => {
        source
            .pipe(
                accumulator(FlushStrategy.rolling, 3, "ts", {
                    objectMode: true,
                }),
            )
            .on("data", (flush: TestObject[]) => {
                t.deepEqual(flush, flushes[chunkIndex]);
                chunkIndex++;
            })
            .on("error", (e: any) => {
                reject(e);
            })
            .on("end", resolve);
        [...firstFlush, ...secondFlush].forEach((item) => {
            source.push(item);
        });
        source.push(null);
    });
});

test("accumulator() rolling should emit error and ignore chunk when its missing key", (t) => {
    t.plan(2);
    let index = 0;
    interface TestObject {
        ts: number;
        key: string;
    }
    const source = new Readable({ objectMode: true });
    const accumulatorStream = accumulator(
        FlushStrategy.rolling,
        3,
        "nonExistingKey",
        { objectMode: true },
    );
    const input = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
    ];

    return new Promise((resolve, reject) => {
        source
            .pipe(accumulatorStream)
            .on("data", (flush: TestObject[]) => {
                // No valid data output
                expect(flush).to.deep.equal([]);
            })
            .on("error", (err: any) => {
                source.pipe(accumulatorStream);
                accumulatorStream.resume();
                expect(err.message).to.equal(
                    `Key is missing in event: (nonExistingKey, ${JSON.stringify(
                        input[index],
                    )})`,
                );
                index++;
                t.pass();
            })
            .on("end", resolve);
        input.forEach((item) => {
            source.push(item);
        });
        source.push(null);
    });
});

test("accumulator() rolling should emit error, ignore chunk when key is missing and continue processing chunks correctly", (t) => {
    t.plan(3);
    let chunkIndex = 0;
    interface TestObject {
        ts: number;
        key: string;
    }
    const source = new Readable({ objectMode: true });
    const accumulatorStream = accumulator(FlushStrategy.rolling, 3, "ts", {
        objectMode: true,
    });
    const input = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
        { key: "d" },
        { ts: 3, key: "e" },
    ];
    const firstFlush = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
    ];
    const secondFlush = [{ ts: 3, key: "e" }];
    const flushes = [firstFlush, secondFlush];

    return new Promise((resolve, reject) => {
        source
            .pipe(accumulatorStream)
            .on("data", (flush: TestObject[]) => {
                t.deepEqual(flush, flushes[chunkIndex]);
                chunkIndex++;
            })
            .on("error", (err: any) => {
                source.pipe(accumulatorStream);
                accumulatorStream.resume();
                expect(err.message).to.equal(
                    `Key is missing in event: (ts, ${JSON.stringify(
                        input[3],
                    )})`,
                );
                t.pass();
            })
            .on("end", resolve);
        input.forEach((item) => {
            source.push(item);
        });
        source.push(null);
    });
});

test("accumulator() sliding", (t) => {
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
    const secondFlush = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
    ];
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
    return new Promise((resolve, reject) => {
        source
            .pipe(
                accumulator(FlushStrategy.sliding, 3, undefined, {
                    objectMode: true,
                }),
            )
            .on("data", (flush: TestObject[]) => {
                t.deepEqual(flush, flushes[chunkIndex]);
                chunkIndex++;
            })
            .on("error", reject)
            .on("end", resolve);
        input.forEach((item) => {
            source.push(item);
        });
        source.push(null);
    });
});

test("accumulator() sliding with key", (t) => {
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
    const secondFlush = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
    ];
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
    const fifthFlush = [
        { ts: 3, key: "d" },
        { ts: 5, key: "f" },
    ];
    const sixthFlush = [
        { ts: 5, key: "f" },
        { ts: 6, key: "g" },
    ];

    const flushes = [
        firstFlush,
        secondFlush,
        thirdFlush,
        fourthFlush,
        fifthFlush,
        sixthFlush,
    ];
    return new Promise((resolve, reject) => {
        source
            .pipe(
                accumulator(FlushStrategy.sliding, 3, "ts", {
                    objectMode: true,
                }),
            )
            .on("data", (flush: TestObject[]) => {
                t.deepEqual(flush, flushes[chunkIndex]);
                chunkIndex++;
            })
            .on("error", reject)
            .on("end", resolve);
        input.forEach((item) => {
            source.push(item);
        });
        source.push(null);
    });
});

test("accumulator() sliding should emit error and ignore chunk when key is missing", (t) => {
    t.plan(2);
    let index = 0;
    interface TestObject {
        ts: number;
        key: string;
    }
    const source = new Readable({ objectMode: true });
    const accumulatorStream = accumulator(
        FlushStrategy.sliding,
        3,
        "nonExistingKey",
        { objectMode: true },
    );
    const input = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
    ];
    return new Promise((resolve, reject) => {
        source
            .pipe(accumulatorStream)
            .on("data", (flush: TestObject[]) => {
                expect(flush).to.deep.equal([]);
            })
            .on("error", (err: any) => {
                source.pipe(accumulatorStream);
                accumulatorStream.resume();
                expect(err.message).to.equal(
                    `Key is missing in event: (nonExistingKey, ${JSON.stringify(
                        input[index],
                    )})`,
                );
                index++;
                t.pass();
            })
            .on("end", resolve);
        input.forEach((item) => {
            source.push(item);
        });
        source.push(null);
    });
});

test("accumulator() sliding should emit error, ignore chunk when key is missing and continue processing chunks correctly", (t) => {
    t.plan(6);
    let chunkIndex = 0;
    interface TestObject {
        ts: number;
        key: string;
    }
    const source = new Readable({ objectMode: true });
    const accumulatorStream = accumulator(FlushStrategy.sliding, 3, "ts", {
        objectMode: true,
    });
    const input = [
        { ts: 0, key: "a" },
        { key: "b" },
        { ts: 2, key: "c" },
        { ts: 3, key: "d" },
        { ts: 5, key: "f" },
        { ts: 6, key: "g" },
    ];
    const firstFlush = [{ ts: 0, key: "a" }];
    const secondFlush = [
        { ts: 0, key: "a" },
        { ts: 2, key: "c" },
    ];
    const thirdFlush = [
        { ts: 2, key: "c" },
        { ts: 3, key: "d" },
    ];
    const fourthFlush = [
        { ts: 3, key: "d" },
        { ts: 5, key: "f" },
    ];
    const fifthFlush = [
        { ts: 5, key: "f" },
        { ts: 6, key: "g" },
    ];

    const flushes = [
        firstFlush,
        secondFlush,
        thirdFlush,
        fourthFlush,
        fifthFlush,
    ];
    return new Promise((resolve, reject) => {
        source
            .pipe(accumulatorStream)
            .on("data", (flush: TestObject[]) => {
                t.deepEqual(flush, flushes[chunkIndex]);
                chunkIndex++;
            })
            .on("error", (err: any) => {
                source.pipe(accumulatorStream);
                accumulatorStream.resume();
                expect(err.message).to.equal(
                    `Key is missing in event: (ts, ${JSON.stringify(
                        input[1],
                    )})`,
                );
                t.pass();
            })
            .on("end", resolve);
        input.forEach((item) => {
            source.push(item);
        });
        source.push(null);
    });
});

test("accumulatorBy() rolling", (t) => {
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

    return new Promise((resolve, reject) => {
        source
            .pipe(
                accumulatorBy(
                    FlushStrategy.rolling,
                    (event: TestObject, bufferChunk: TestObject) => {
                        return bufferChunk.ts + 3 <= event.ts;
                    },
                    { objectMode: true },
                ),
            )
            .on("data", (flush: TestObject[]) => {
                t.deepEqual(flush, flushes[chunkIndex]);
                chunkIndex++;
            })
            .on("error", reject)
            .on("end", resolve);
        [...firstFlush, ...secondFlush].forEach((item) => {
            source.push(item);
        });
        source.push(null);
    });
});

test("accumulatorBy() rolling should emit error when key iteratee throws", (t) => {
    t.plan(1);
    interface TestObject {
        ts: number;
        key: string;
    }
    const source = new Readable({ objectMode: true });
    const input = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
    ];
    const accumulaterStream = accumulatorBy(
        FlushStrategy.rolling,
        (event: TestObject, bufferChunk: TestObject) => {
            if (event.key !== "a") {
                throw new Error("Failed mapping");
            }
            return bufferChunk.ts + 3 <= event.ts;
        },
        { objectMode: true },
    );
    return new Promise((resolve, reject) => {
        source
            .pipe(accumulaterStream)
            .on("error", (err: any) => {
                source.pipe(accumulaterStream);
                accumulaterStream.resume();
                expect(err.message).to.equal("Failed mapping");
                t.pass();
            })
            .on("close", resolve);

        input.forEach((item) => {
            source.push(item);
        });
        source.push(null);
    });
});

test("accumulatorBy() sliding", (t) => {
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
    const secondFlush = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
    ];
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
    const fifthFlush = [
        { ts: 3, key: "d" },
        { ts: 5, key: "f" },
    ];
    const sixthFlush = [
        { ts: 5, key: "f" },
        { ts: 6, key: "g" },
    ];

    const flushes = [
        firstFlush,
        secondFlush,
        thirdFlush,
        fourthFlush,
        fifthFlush,
        sixthFlush,
    ];
    return new Promise((resolve, reject) => {
        source
            .pipe(
                accumulatorBy(
                    FlushStrategy.sliding,
                    (event: TestObject, bufferChunk: TestObject) => {
                        return bufferChunk.ts + 3 <= event.ts ? true : false;
                    },
                    { objectMode: true },
                ),
            )
            .on("data", (flush: TestObject[]) => {
                t.deepEqual(flush, flushes[chunkIndex]);
                chunkIndex++;
            })
            .on("error", reject)
            .on("end", resolve);
        input.forEach((item) => {
            source.push(item);
        });
        source.push(null);
    });
});

test("accumulatorBy() sliding should emit error when key iteratee throws", (t) => {
    t.plan(1);
    interface TestObject {
        ts: number;
        key: string;
    }
    const source = new Readable({ objectMode: true });
    const input = [
        { ts: 0, key: "a" },
        { ts: 1, key: "b" },
        { ts: 2, key: "c" },
    ];
    const accumulatorStream = accumulatorBy(
        FlushStrategy.sliding,
        (event: TestObject, bufferChunk: TestObject) => {
            if (event.key !== "a") {
                throw new Error("Failed mapping");
            }
            return bufferChunk.ts + 3 <= event.ts ? true : false;
        },
        { objectMode: true },
    );
    return new Promise((resolve, reject) => {
        source
            .pipe(accumulatorStream)
            .on("error", (err: any) => {
                expect(err.message).to.equal("Failed mapping");
                t.pass();
            })
            .on("close", resolve);

        input.forEach((item) => {
            source.push(item);
        });
        source.push(null);
    });
});
