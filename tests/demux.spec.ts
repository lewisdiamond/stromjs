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

    const demuxed = demux(construct, { key: "key" }, { objectMode: true });

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

    const demuxed = demux(construct, { key: "key" }, { objectMode: true });

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

    const demuxed = demux(
        construct,
        { keyBy: item => item.key },
        { objectMode: true },
    );

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

    const demuxed = demux(
        construct,
        { keyBy: item => item.key },
        { objectMode: true },
    );

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

test("demux() should return false after if it has >= highWaterMark items buffered and drain should be emitted", t => {
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

            // to clear first
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

        const _demux = demux(
            construct,
            { key: "key" },
            {
                objectMode: true,
                highWaterMark,
            },
        );

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

test("demux() when write returns false, drain event should be emitted after at least slowProcessorSpeed * highWaterMark", t => {
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
        const sink = new Writable({
            objectMode: true,
            write(chunk, encoding, cb) {
                cb();
                t.pass();
                pendingReads--;
                if (pendingReads === 0) {
                    resolve();
                }
            },
        });
        const construct = (destKey: string) => {
            const first = map(
                async (chunk: Chunk) => {
                    await sleep(slowProcessorSpeed);
                    chunk.mapped.push(1);
                    return chunk;
                },
                { highWaterMark: 1, objectMode: true },
            );

            first.pipe(sink);
            return first;
        };
        const _demux = demux(
            construct,
            { key: "key" },
            {
                objectMode: true,
                highWaterMark,
            },
        );
        _demux.on("error", err => {
            reject();
        });

        let start = performance.now();
        for (const item of input) {
            const res = _demux.write(item);
            if (!res) {
                await new Promise((resolv, rej) => {
                    _demux.once("drain", () => {
                        expect(performance.now() - start).to.be.greaterThan(
                            slowProcessorSpeed * highWaterMark,
                        );
                        t.pass();
                        resolv();
                        start = performance.now();
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
            { key: "a", val: 1, mapped: [] },
            { key: "a", val: 2, mapped: [] },
            { key: "a", val: 3, mapped: [] },
            { key: "a", val: 4, mapped: [] },
            { key: "a", val: 5, mapped: [] },
            { key: "a", val: 6, mapped: [] },
        ];
        let pendingReads = input.length;
        const sink = new Writable({
            objectMode: true,
            write(chunk, encoding, cb) {
                cb();
                pendingReads--;
                t.pass();
                if (pendingReads === 0) {
                    resolve();
                }
            },
        });
        const construct = (destKey: string) => {
            const pipeline = map(
                async (chunk: Chunk) => {
                    await sleep(50);
                    chunk.mapped.push(2);
                    return chunk;
                },
                { highWaterMark: 1, objectMode: true },
            );

            pipeline.pipe(sink);
            return pipeline;
        };
        const _demux = demux(
            construct,
            { key: "key" },
            {
                objectMode: true,
                highWaterMark: 5,
            },
        );

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

test.cb(
    "demux() should emit drain event immediately when second stream is bottleneck",
    t => {
        t.plan(6);
        const slowProcessorSpeed = 100;
        const highWaterMark = 3;
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
        const _demux = demux(
            construct,
            { key: "key" },
            {
                objectMode: true,
                highWaterMark,
            },
        );
        _demux.on("error", err => {
            t.end(err);
        });

        _demux.on("drain", () => {
            expect(_demux._writableState.length).to.be.equal(0);
            // Should take longer than the amount of items needed to be processed until we are under highWaterMark
            expect(performance.now() - start).to.be.greaterThan(
                slowProcessorSpeed * (input.length - highWaterMark - 1),
            );
            t.pass();
        });

        const input = [
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
            { key: "a", mapped: [] },
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
        const sink = new Writable({
            objectMode: true,
            write(chunk, encoding, cb) {
                cb();
                pendingReads--;
                if (chunk.key === "b") {
                    expect(performance.now() - start).to.be.greaterThan(
                        slowProcessorSpeed * totalItems,
                    );
                    t.pass();
                    expect(pendingReads).to.equal(0);
                    resolve();
                }
            },
        });
        const construct = (destKey: string) => {
            const first = map(
                async (chunk: Chunk) => {
                    await sleep(slowProcessorSpeed);
                    chunk.mapped.push(1);
                    return chunk;
                },
                { objectMode: true, highWaterMark: 1 },
            );

            first.pipe(sink);
            return first;
        };
        const _demux = demux(
            construct,
            { key: "key" },
            {
                objectMode: true,
                highWaterMark: 1,
            },
        );
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

test("demux() should emit drain event and first should contain up to highWaterMark items in readable state when second is bottleneck", t => {
    t.plan(6);
    const highWaterMark = 5;
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
                { objectMode: true, highWaterMark: 1 },
            );

            const second = map(
                async (chunk: Chunk) => {
                    chunk.mapped.push(2);
                    expect(second._writableState.length).to.be.equal(1);
                    await sleep(100);
                    pendingReads--;
                    return chunk;
                },
                { objectMode: true, highWaterMark: 1 },
            );

            first.pipe(second).pipe(sink);
            return first;
        };
        const _demux = demux(
            construct,
            { key: "key" },
            {
                objectMode: true,
                highWaterMark,
            },
        );
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
            { key: "a", mapped: [] },
        ];
        let pendingReads = input.length;

        input.forEach(item => {
            _demux.write(item);
        });
    });
});
