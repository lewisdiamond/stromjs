import test from "ava";
import { expect } from "chai";
import { demux, map, fromArray } from "../src";
import { Writable, Readable } from "stream";
import * as sinon from "sinon";
import { sleep } from "../src/helpers";
import { performance } from "perf_hooks";

interface Test {
    key: string;
    visited: number[];
}

test.cb("demux() constructor should be called once per key", t => {
    t.plan(1);
    const input = [
        { key: "a", visited: [] },
        { key: "b", visited: [] },
        { key: "a", visited: [] },
        { key: "c", visited: [] },
        { key: "a", visited: [] },
        { key: "b", visited: [] },
    ];
    const construct = sinon.spy((_destKey: string) => {
        return map((chunk: Test) => {
            chunk.visited.push(1);
            return chunk;
        });
    });

    const demuxed = demux(construct, "key", {});

    demuxed.on("finish", () => {
        expect(construct.withArgs("a").callCount).to.equal(1);
        expect(construct.withArgs("b").callCount).to.equal(1);
        expect(construct.withArgs("c").callCount).to.equal(1);
        t.pass();
        t.end();
    });

    fromArray(input).pipe(demuxed);
});

test.cb("demux() item written passed in constructor", t => {
    t.plan(4);
    const input = [
        { key: "a", visited: [] },
        { key: "b", visited: [] },
        { key: "c", visited: [] },
    ];
    const construct = sinon.spy((destKey: string, item: any) => {
        expect(item).to.deep.equal({ key: destKey, visited: [] });
        t.pass();
        const dest = map((chunk: Test) => {
            chunk.visited.push(1);
            return chunk;
        });

        return dest;
    });

    const demuxed = demux(construct, "key", {});

    demuxed.on("finish", () => {
        t.pass();
        t.end();
    });

    fromArray(input).pipe(demuxed);
});

test.cb("demux() should send input through correct pipeline", t => {
    t.plan(6);
    const input = [
        { key: "a", visited: [] },
        { key: "b", visited: [] },
        { key: "a", visited: [] },
        { key: "c", visited: [] },
        { key: "a", visited: [] },
        { key: "b", visited: [] },
    ];
    const pipelineSpies = {};
    const construct = (destKey: string) => {
        const mapper = sinon.spy((chunk: Test) => {
            return { ...chunk, visited: [1] };
        });
        const dest = map(mapper);
        pipelineSpies[destKey] = mapper;

        return dest;
    };

    const demuxed = demux(construct, "key", {});

    demuxed.on("finish", () => {
        pipelineSpies["a"].getCalls().forEach(call => {
            expect(call.args[0].key).to.equal("a");
            t.pass();
        });
        pipelineSpies["b"].getCalls().forEach(call => {
            expect(call.args[0].key).to.equal("b");
            t.pass();
        });
        pipelineSpies["c"].getCalls().forEach(call => {
            expect(call.args[0].key).to.equal("c");
            t.pass();
        });
        t.end();
    });

    fromArray(input).pipe(demuxed);
});

test.cb("demux() constructor should be called once per key using keyBy", t => {
    t.plan(1);
    const input = [
        { key: "a", visited: [] },
        { key: "b", visited: [] },
        { key: "a", visited: [] },
        { key: "c", visited: [] },
        { key: "a", visited: [] },
        { key: "b", visited: [] },
    ];

    const construct = sinon.spy((_destKey: string) => {
        return map((chunk: Test) => {
            chunk.visited.push(1);
            return chunk;
        });
    });

    const demuxed = demux(construct, item => item.key, {});

    demuxed.on("finish", () => {
        expect(construct.withArgs("a").callCount).to.equal(1);
        expect(construct.withArgs("b").callCount).to.equal(1);
        expect(construct.withArgs("c").callCount).to.equal(1);
        t.pass();
        t.end();
    });

    fromArray(input).pipe(demuxed);
});

test.cb("demux() should send input through correct pipeline using keyBy", t => {
    t.plan(6);
    const input = [
        { key: "a", visited: [] },
        { key: "b", visited: [] },
        { key: "a", visited: [] },
        { key: "c", visited: [] },
        { key: "a", visited: [] },
        { key: "b", visited: [] },
    ];
    const pipelineSpies = {};
    const construct = (destKey: string) => {
        const mapper = sinon.spy((chunk: Test) => {
            return { ...chunk, visited: [1] };
        });
        const dest = map(mapper);
        pipelineSpies[destKey] = mapper;

        return dest;
    };

    const demuxed = demux(construct, item => item.key, {});

    demuxed.on("finish", () => {
        pipelineSpies["a"].getCalls().forEach(call => {
            expect(call.args[0].key).to.equal("a");
            t.pass();
        });
        pipelineSpies["b"].getCalls().forEach(call => {
            expect(call.args[0].key).to.equal("b");
            t.pass();
        });
        pipelineSpies["c"].getCalls().forEach(call => {
            expect(call.args[0].key).to.equal("c");
            t.pass();
        });
        t.end();
    });

    fromArray(input).pipe(demuxed);
});

test("demux() write should return false and emit drain if more than highWaterMark items are buffered", t => {
    return new Promise(async (resolve, reject) => {
        t.plan(7);
        interface Chunk {
            key: string;
            mapped: number[];
        }
        const input: Chunk[] = [
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
        ];
        let pendingReads = input.length;
        const highWaterMark = 5;
        const slowProcessorSpeed = 25;
        const construct = (_destKey: string) => {
            const first = map(
                async (chunk: Chunk) => {
                    await sleep(slowProcessorSpeed);
                    return { ...chunk, mapped: [1] };
                },
                { highWaterMark: 1 },
            );

            first.on("data", chunk => {
                expect(chunk.mapped).to.deep.equal([1]);
                pendingReads--;
                if (pendingReads === 0) {
                    resolve();
                }
                t.pass();
            });

            return first;
        };

        const _demux = demux(construct, "key", {
            highWaterMark,
        });

        _demux.on("error", _err => {
            reject();
        });

        for (const item of input) {
            const res = _demux.write(item);
            expect(_demux._writableState.length).to.be.at.most(highWaterMark);
            if (!res) {
                await new Promise((resolv, _rej) => {
                    _demux.once("drain", () => {
                        expect(_demux._writableState.length).to.be.equal(0);
                        t.pass();
                        resolv();
                    });
                });
            }
        }
    });
});

test("demux() should emit one drain event after slowProcessorSpeed * highWaterMark ms when first stream is bottleneck", t => {
    return new Promise(async (resolve, reject) => {
        t.plan(7);
        interface Chunk {
            key: string;
            mapped: number[];
        }
        const input: Chunk[] = [
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
        ];
        let pendingReads = input.length;
        const highWaterMark = 5;
        const slowProcessorSpeed = 25;

        const construct = (_destKey: string) => {
            const first = map(
                async (chunk: Chunk) => {
                    await sleep(slowProcessorSpeed);
                    chunk.mapped.push(1);
                    return chunk;
                },
                { highWaterMark: 1 },
            );

            first.on("data", () => {
                t.pass();
                pendingReads--;
                if (pendingReads === 0) {
                    resolve();
                }
            });
            return first;
        };
        const _demux = demux(construct, "key", {
            highWaterMark,
        });
        _demux.on("error", _err => {
            reject();
        });

        const start = performance.now();
        for (const item of input) {
            const res = _demux.write(item);
            if (!res) {
                await new Promise((resolv, _rej) => {
                    // This event should be received after all items in demux are processed
                    _demux.once("drain", () => {
                        expect(performance.now() - start).to.be.greaterThan(
                            slowProcessorSpeed * highWaterMark,
                        );
                        t.pass();
                        resolv(null);
                    });
                });
            }
        }
    });
});

test("demux() should emit one drain event when writing 6 items with highWaterMark of 5", t => {
    return new Promise(async (resolve, reject) => {
        t.plan(1);
        interface Chunk {
            key: string;
            mapped: number[];
        }
        const highWaterMark = 5;
        const input = [
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
        ];
        let pendingReads = input.length;
        const construct = (_destKey: string) => {
            const first = map(
                async (chunk: Chunk) => {
                    await sleep(50);
                    chunk.mapped.push(2);
                    return chunk;
                },
                { highWaterMark: 1 },
            );

            first.on("data", () => {
                pendingReads--;
                if (pendingReads === 0) {
                    resolve();
                }
            });
            return first;
        };
        const _demux = demux(construct, "key", {
            highWaterMark: 5,
        });

        _demux.on("error", _err => {
            reject();
        });

        for (const item of input) {
            const res = _demux.write(item);
            expect(_demux._writableState.length).to.be.at.most(highWaterMark);
            if (!res) {
                await new Promise(_resolve => {
                    _demux.once("drain", () => {
                        _resolve(null);
                        expect(_demux._writableState.length).to.be.equal(0);
                        t.pass();
                    });
                });
            }
        }
    });
});

test.cb(
    "demux() should emit drain event when second stream is bottleneck after (highWaterMark - 2) * slowProcessorSpeed ms",
    t => {
        // ie) first two items are pushed directly into first and second streams (highWaterMark - 2 remain in demux)
        t.plan(8);
        const slowProcessorSpeed = 100;
        const highWaterMark = 5;
        interface Chunk {
            key: string;
            mapped: number[];
        }
        const sink = new Writable({
            objectMode: true,
            write(chunk, encoding, cb) {
                expect(chunk.mapped).to.deep.equal([1, 2]);
                t.pass();
                pendingReads--;
                if (pendingReads === 0) {
                    t.end();
                }
                cb();
            },
        });
        const construct = (destKey: string) => {
            const first = map(
                (chunk: Chunk) => {
                    chunk.mapped.push(1);
                    return chunk;
                },
                { highWaterMark: 1 },
            );

            const second = map(
                async (chunk: Chunk) => {
                    await sleep(slowProcessorSpeed);
                    chunk.mapped.push(2);
                    return chunk;
                },
                { highWaterMark: 1 },
            );

            first.pipe(second).pipe(sink);
            return first;
        };
        const _demux = demux(construct, () => "a", {
            highWaterMark,
        });
        _demux.on("error", err => {
            t.end(err);
        });

        _demux.on("drain", () => {
            expect(_demux._writableState.length).to.be.equal(0);
            expect(performance.now() - start).to.be.greaterThan(
                slowProcessorSpeed * 3,
            );
            t.pass();
        });

        const input = [
            { key: "a", mapped: [] },
            { key: "b", mapped: [] },
            { key: "c", mapped: [] },
            { key: "d", mapped: [] },
            { key: "e", mapped: [] },
            { key: "f", mapped: [] },
            { key: "g", mapped: [] },
        ];
        let pendingReads = input.length;

        const start = performance.now();
        fromArray(input).pipe(_demux);
    },
);

test.cb(
    "demux() should emit drain event when third stream is bottleneck",
    t => {
        // @TODO investigate why drain is emitted after slowProcessorSpeed
        t.plan(8);
        const slowProcessorSpeed = 100;
        const highWaterMark = 5;
        interface Chunk {
            key: string;
            mapped: number[];
        }
        const sink = new Writable({
            objectMode: true,
            write(chunk, encoding, cb) {
                expect(chunk.mapped).to.deep.equal([1, 2, 3]);
                t.pass();
                pendingReads--;
                if (pendingReads === 0) {
                    t.end();
                }
                cb();
            },
        });
        const construct = (destKey: string) => {
            const first = map(
                (chunk: Chunk) => {
                    chunk.mapped.push(1);
                    return chunk;
                },
                { highWaterMark: 1 },
            );
            const second = map(
                (chunk: Chunk) => {
                    chunk.mapped.push(2);
                    return chunk;
                },
                { highWaterMark: 1 },
            );

            const third = map(
                async (chunk: Chunk) => {
                    await sleep(slowProcessorSpeed);
                    chunk.mapped.push(3);
                    return chunk;
                },
                { highWaterMark: 1 },
            );

            first
                .pipe(second)
                .pipe(third)
                .pipe(sink);
            return first;
        };
        const _demux = demux(construct, () => "a", {
            highWaterMark,
        });
        _demux.on("error", err => {
            t.end(err);
        });

        _demux.on("drain", () => {
            expect(_demux._writableState.length).to.be.equal(0);
            expect(performance.now() - start).to.be.greaterThan(
                slowProcessorSpeed,
            );
            t.pass();
        });

        const input = [
            { key: "a", mapped: [] },
            { key: "b", mapped: [] },
            { key: "c", mapped: [] },
            { key: "d", mapped: [] },
            { key: "e", mapped: [] },
            { key: "f", mapped: [] },
            { key: "g", mapped: [] },
        ];
        let pendingReads = input.length;

        const start = performance.now();
        fromArray(input).pipe(_demux);
    },
);

test("demux() should be blocked by slowest pipeline", t => {
    t.plan(1);
    const slowProcessorSpeed = 100;
    interface Chunk {
        key: string;
        mapped: number[];
    }
    return new Promise(async (resolve, reject) => {
        const construct = (destKey: string) => {
            const first = map(
                async (chunk: Chunk) => {
                    await sleep(slowProcessorSpeed);
                    chunk.mapped.push(1);
                    return chunk;
                },
                { highWaterMark: 1 },
            );

            return first;
        };

        const _demux = demux(construct, "key", {
            highWaterMark: 1,
        });

        _demux.on("error", err => {
            reject(err);
        });

        _demux.on("data", async chunk => {
            pendingReads--;
            if (chunk.key === "b") {
                expect(performance.now() - start).to.be.greaterThan(
                    slowProcessorSpeed * totalItems,
                );
                t.pass();
                expect(pendingReads).to.equal(0);
                resolve();
            }
        });

        const input = [
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "c", mapped: [] },
            { key: "c", mapped: [] },
            { key: "b", mapped: [] },
        ];

        let pendingReads = input.length;
        const totalItems = input.length;
        const start = performance.now();
        for (const item of input) {
            if (!_demux.write(item)) {
                await new Promise(_resolve => {
                    _demux.once("drain", () => {
                        _resolve();
                    });
                });
            }
        }
    });
});

test.cb("Demux should remux to sink", t => {
    t.plan(6);
    let i = 0;
    const input = [
        { key: "a", visited: [] },
        { key: "b", visited: [] },
        { key: "a", visited: [] },
        { key: "c", visited: [] },
        { key: "a", visited: [] },
        { key: "b", visited: [] },
    ];
    const result = [
        { key: "a", visited: ["a"] },
        { key: "b", visited: ["b"] },
        { key: "a", visited: ["a"] },
        { key: "c", visited: ["c"] },
        { key: "a", visited: ["a"] },
        { key: "b", visited: ["b"] },
    ];
    const construct = (destKey: string) => {
        const dest = map((chunk: any) => {
            chunk.visited.push(destKey);
            return chunk;
        });

        return dest;
    };

    const sink = map(d => {
        t.deepEqual(d, result[i]);
        i++;
        if (i === input.length) {
            t.end();
        }
    });

    const demuxed = demux(construct, "key", {});

    fromArray(input)
        .pipe(demuxed)
        .pipe(sink);
});

test.cb("Demux should send data events", t => {
    t.plan(6);
    let i = 0;
    const input = [
        { key: "a", visited: [] },
        { key: "b", visited: [] },
        { key: "a", visited: [] },
        { key: "c", visited: [] },
        { key: "a", visited: [] },
        { key: "b", visited: [] },
    ];
    const result = [
        { key: "a", visited: ["a"] },
        { key: "b", visited: ["b"] },
        { key: "a", visited: ["a"] },
        { key: "c", visited: ["c"] },
        { key: "a", visited: ["a"] },
        { key: "b", visited: ["b"] },
    ];
    const construct = (destKey: string) => {
        const dest = map((chunk: any) => {
            chunk.visited.push(destKey);
            return chunk;
        });

        return dest;
    };

    const demuxed = demux(construct, "key", {});

    fromArray(input).pipe(demuxed);

    demuxed.on("data", d => {
        t.deepEqual(d, result[i]);
        i++;
        if (i === input.length) {
            t.end();
        }
    });
});

test.cb("demux() `finish` and `end` propagates", t => {
    t.plan(10);
    const construct = (destKey: string) => {
        const dest = map((chunk: any) => {
            chunk.mapped.push(destKey);
            return chunk;
        });
        return dest;
    };

    const _demux = demux(construct, "key", {
        highWaterMark: 3,
    });

    const fakeSource = new Readable({
        objectMode: true,
        read() {
            return;
        },
    });

    const sink = map((d: any) => {
        const curr = input.shift();
        t.is(curr.key, d.key);
        t.deepEqual(d.mapped, [d.key]);
    });

    fakeSource.pipe(_demux).pipe(sink);

    fakeSource.on("end", () => {
        t.pass();
    });
    _demux.on("finish", () => {
        t.pass();
    });
    _demux.on("unpipe", () => {
        t.pass();
    });
    _demux.on("end", () => {
        t.pass();
    });
    sink.on("finish", () => {
        t.pass();
        t.end();
    });

    const input = [
        { key: "a", mapped: [] },
        { key: "b", mapped: [] },
        { key: "a", mapped: [] },
        { key: "a", mapped: [] },
        { key: "b", mapped: [] },
    ];
    fakeSource.push(input[0]);
    fakeSource.push(input[1]);
    fakeSource.push(null);
});

test.cb("demux() `unpipe` propagates", t => {
    interface Chunk {
        key: string;
        mapped: number[];
    }

    t.plan(7);

    const construct = (destKey: string) => {
        const dest = map((chunk: any) => {
            chunk.mapped.push(destKey);
            return chunk;
        });
        return dest;
    };

    const _demux = demux(construct, "key", {
        highWaterMark: 3,
    });

    const fakeSource = new Readable({
        objectMode: true,
        read() {
            return;
        },
    });

    const sink = map((d: any) => {
        const curr = input.shift();
        t.is(curr.key, d.key);
        t.deepEqual(d.mapped, [d.key]);
    });

    fakeSource.pipe(_demux).pipe(sink);

    _demux.on("unpipe", () => {
        t.pass();
    });

    sink.on("unpipe", () => {
        t.pass();
    });

    sink.on("finish", () => {
        t.pass();
        t.end();
    });

    const input = [
        { key: "a", mapped: [] },
        { key: "b", mapped: [] },
        { key: "a", mapped: [] },
        { key: "a", mapped: [] },
        { key: "b", mapped: [] },
    ];
    fakeSource.push(input[0]);
    fakeSource.push(input[1]);
    fakeSource.push(null);
});

test.cb("demux() should be 'destroyable'", t => {
    t.plan(2);
    const _sleep = 100;
    interface Chunk {
        key: string;
        mapped: string[];
    }

    const construct = (destKey: string) => {
        const first = map(async (chunk: Chunk) => {
            await sleep(_sleep);
            chunk.mapped.push(destKey);
            return chunk;
        });
        return first;
    };

    const _demux = demux(construct, "key");

    const fakeSource = new Readable({
        objectMode: true,
        read() {
            return;
        },
    });

    const fakeSink = new Writable({
        objectMode: true,
        write(data, enc, cb) {
            const cur = input.shift();
            t.is(cur.key, data.key);
            t.deepEqual(cur.mapped, ["a"]);
            if (cur.key === "a") {
                _demux.destroy();
            }
            cb();
        },
    });

    _demux.on("close", t.end);
    fakeSource.pipe(_demux).pipe(fakeSink);

    const input = [
        { key: "a", mapped: [] },
        { key: "b", mapped: [] },
        { key: "c", mapped: [] },
        { key: "d", mapped: [] },
        { key: "e", mapped: [] },
    ];
    fakeSource.push(input[0]);
    fakeSource.push(input[1]);
    fakeSource.push(input[2]);
    fakeSource.push(input[3]);
    fakeSource.push(input[4]);
});
