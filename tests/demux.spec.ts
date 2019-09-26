import test from "ava";
import { expect } from "chai";
const { demux, map } = require("../src");
import { Writable } from "stream";
const sinon = require("sinon");
const { sleep } = require("../src/helpers");
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
    const construct = sinon.spy((destKey: string) => {
        const dest = map((chunk: Test) => {
            chunk.visited.push(1);
            return chunk;
        });

        return dest;
    });

    const demuxed = demux(construct, "key", { objectMode: true });

    demuxed.on("finish", () => {
        expect(construct.withArgs("a").callCount).to.equal(1);
        expect(construct.withArgs("b").callCount).to.equal(1);
        expect(construct.withArgs("c").callCount).to.equal(1);
        t.pass();
        t.end();
    });

    input.forEach(event => demuxed.write(event));
    demuxed.end();
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

    const demuxed = demux(construct, "key", { objectMode: true });

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

    input.forEach(event => demuxed.write(event));
    demuxed.end();
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

    const construct = sinon.spy((destKey: string) => {
        const dest = map((chunk: Test) => {
            chunk.visited.push(1);
            return chunk;
        });

        return dest;
    });

    const demuxed = demux(construct, item => item.key, { objectMode: true });

    demuxed.on("finish", () => {
        expect(construct.withArgs("a").callCount).to.equal(1);
        expect(construct.withArgs("b").callCount).to.equal(1);
        expect(construct.withArgs("c").callCount).to.equal(1);
        t.pass();
        t.end();
    });

    input.forEach(event => demuxed.write(event));
    demuxed.end();
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

    const demuxed = demux(construct, item => item.key, { objectMode: true });

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

    input.forEach(event => demuxed.write(event));
    demuxed.end();
});

test("demux() write should return false after if it has >= highWaterMark items buffered and drain should be emitted", t => {
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
        const construct = (destKey: string) => {
            const first = map(
                async (chunk: Chunk) => {
                    await sleep(slowProcessorSpeed);
                    return { ...chunk, mapped: [1] };
                },
                { highWaterMark: 1, objectMode: true },
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
            objectMode: true,
            highWaterMark,
        });

        _demux.on("error", err => {
            reject();
        });

        for (const item of input) {
            const res = _demux.write(item);
            expect(_demux._writableState.length).to.be.at.most(highWaterMark);
            if (!res) {
                await new Promise((resolv, rej) => {
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

test("demux() should emit one drain event after slowProcessorSpeed * highWaterMark ms", t => {
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

        const construct = (destKey: string) => {
            const first = map(
                async (chunk: Chunk) => {
                    await sleep(slowProcessorSpeed);
                    chunk.mapped.push(1);
                    return chunk;
                },
                { highWaterMark: 1, objectMode: true },
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
            objectMode: true,
            highWaterMark,
        });
        _demux.on("error", err => {
            reject();
        });

        const start = performance.now();
        for (const item of input) {
            const res = _demux.write(item);
            if (!res) {
                await new Promise((resolv, rej) => {
                    // This event should be received after all items in demux are processed
                    _demux.once("drain", () => {
                        expect(performance.now() - start).to.be.greaterThan(
                            slowProcessorSpeed * highWaterMark,
                        );
                        t.pass();
                        resolv();
                    });
                });
            }
        }
    });
});

test("demux() should emit one drain event when writing 6 items with highWaterMark of 5", t => {
    return new Promise(async (resolve, reject) => {
        t.plan(7);
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
        const construct = (destKey: string) => {
            const first = map(
                async (chunk: Chunk) => {
                    await sleep(50);
                    chunk.mapped.push(2);
                    return chunk;
                },
                { highWaterMark: 1, objectMode: true },
            );

            first.on("data", () => {
                pendingReads--;
                t.pass();
                if (pendingReads === 0) {
                    resolve();
                }
            });
            return first;
        };
        const _demux = demux(construct, "key", {
            objectMode: true,
            highWaterMark: 5,
        });

        _demux.on("error", err => {
            reject();
        });

        for (const item of input) {
            const res = _demux.write(item);
            expect(_demux._writableState.length).to.be.at.most(highWaterMark);
            if (!res) {
                await new Promise(_resolve => {
                    _demux.once("drain", () => {
                        _resolve();
                        expect(_demux._writableState.length).to.be.equal(0);
                        t.pass();
                    });
                });
            }
        }
    });
});

test.cb.only(
    "demux() should emit drain event when third stream is bottleneck",
    t => {
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
                { objectMode: true, highWaterMark: 1 },
            );

            const second = map(
                async (chunk: Chunk) => {
                    await sleep(slowProcessorSpeed);
                    chunk.mapped.push(2);
                    return chunk;
                },
                { objectMode: true, highWaterMark: 1 },
            );

            first.pipe(second).pipe(sink);
            return first;
        };
        const _demux = demux(construct, () => "a", {
            objectMode: true,
            highWaterMark,
        });
        _demux.on("error", err => {
            t.end(err);
        });

        // This event should be received after at least 5 * slowProcessorSpeed (two are read immediately by first and second, 5 remaining in demux before drain event)
        _demux.on("drain", () => {
            expect(_demux._writableState.length).to.be.equal(0);
            expect(performance.now() - start).to.be.greaterThan(
                slowProcessorSpeed * (input.length - 2),
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
        input.forEach(item => {
            _demux.write(item);
        });
    },
);

test.cb(
    "demux() should emit drain event when second stream is bottleneck",
    t => {
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
                { objectMode: true, highWaterMark: 1 },
            );
            const second = map(
                (chunk: Chunk) => {
                    chunk.mapped.push(2);
                    return chunk;
                },
                { objectMode: true, highWaterMark: 1 },
            );

            const third = map(
                async (chunk: Chunk) => {
                    await sleep(slowProcessorSpeed);
                    chunk.mapped.push(3);
                    return chunk;
                },
                { objectMode: true, highWaterMark: 1 },
            );

            first
                .pipe(second)
                .pipe(third)
                .pipe(sink);
            return first;
        };
        const _demux = demux(construct, () => "a", {
            objectMode: true,
            highWaterMark,
        });
        _demux.on("error", err => {
            t.end(err);
        });

        // This event should be received after at least 3 * slowProcessorSpeed (two are read immediately by first and second, 3 remaining in demux before drain event)
        _demux.on("drain", () => {
            expect(_demux._writableState.length).to.be.equal(0);
            expect(performance.now() - start).to.be.greaterThan(
                slowProcessorSpeed * (input.length - 4),
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
        input.forEach(item => {
            _demux.write(item);
        });
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
                { objectMode: true, highWaterMark: 1 },
            );

            first.on("data", chunk => {
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
            return first;
        };
        const _demux = demux(construct, "key", {
            objectMode: true,
            highWaterMark: 1,
        });
        _demux.on("error", err => {
            reject(err);
        });

        const input = [
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "c", mapped: [] },
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

test("demux() should emit drain event when second stream in pipeline is bottleneck", t => {
    t.plan(5);
    const highWaterMark = 3;
    return new Promise(async (resolve, reject) => {
        interface Chunk {
            key: string;
            mapped: number[];
        }
        const sink = new Writable({
            objectMode: true,
            write(chunk, encoding, cb) {
                expect(chunk.mapped).to.deep.equal([1, 2]);
                t.pass();
                cb();
                if (pendingReads === 0) {
                    resolve();
                }
            },
        });

        const construct = (destKey: string) => {
            const first = map(
                (chunk: Chunk) => {
                    expect(first._readableState.length).to.be.at.most(2);
                    chunk.mapped.push(1);
                    return chunk;
                },
                { objectMode: true, highWaterMark: 2 },
            );

            const second = map(
                async (chunk: Chunk) => {
                    await sleep(100);
                    chunk.mapped.push(2);
                    expect(second._writableState.length).to.be.equal(1);
                    pendingReads--;
                    return chunk;
                },
                { objectMode: true, highWaterMark: 1 },
            );

            first.pipe(second).pipe(sink);
            return first;
        };

        const _demux = demux(construct, "key", {
            objectMode: true,
            highWaterMark,
        });
        _demux.on("error", err => {
            reject();
        });

        _demux.on("drain", () => {
            expect(_demux._writableState.length).to.be.equal(0);
            t.pass();
        });

        const input = [
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
        ];
        let pendingReads = input.length;

        input.forEach(item => {
            _demux.write(item);
        });
    });
});
