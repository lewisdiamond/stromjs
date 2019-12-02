const test = require("ava");
const { expect } = require("chai");
const { sleep } = require("../src/helpers");
import mhysa from "../src";
import { performance } from "perf_hooks";
const { compose, map } = mhysa({ objectMode: true });

test.cb("compose() chains two streams together in the correct order", t => {
    t.plan(3);
    interface Chunk {
        visited: number[];
        key: string;
    }

    let i = 0;
    const first = map((chunk: Chunk) => {
        chunk.visited.push(1);
        return chunk;
    });
    const second = map((chunk: Chunk) => {
        chunk.visited.push(2);
        return chunk;
    });

    const composed = compose(
        [first, second],
        { objectMode: true },
    );

    composed.on("data", data => {
        expect(data).to.deep.equal(result[i]);
        t.pass();
        i++;
        if (i === 3) {
            t.end();
        }
    });
    composed.on("error", err => {
        t.end(err);
    });
    composed.on("end", () => {
        t.end();
    });

    const input = [
        { key: "a", visited: [] },
        { key: "b", visited: [] },
        { key: "c", visited: [] },
    ];
    const result = [
        { key: "a", visited: [1, 2] },
        { key: "b", visited: [1, 2] },
        { key: "c", visited: [1, 2] },
    ];

    input.forEach(item => composed.write(item));
});

test.cb("piping compose() maintains correct order", t => {
    t.plan(3);
    interface Chunk {
        visited: number[];
        key: string;
    }
    let i = 0;
    const first = map((chunk: Chunk) => {
        chunk.visited.push(1);
        return chunk;
    });
    const second = map((chunk: Chunk) => {
        chunk.visited.push(2);
        return chunk;
    });

    const composed = compose(
        [first, second],
        { objectMode: true },
    );
    const third = map((chunk: Chunk) => {
        chunk.visited.push(3);
        return chunk;
    });

    composed.pipe(third).on("data", data => {
        expect(data).to.deep.equal(result[i]);
        t.pass();
        i++;
        if (i === 3) {
            t.end();
        }
    });

    composed.on("error", err => {
        t.end(err);
    });

    const input = [
        { key: "a", visited: [] },
        { key: "b", visited: [] },
        { key: "c", visited: [] },
    ];
    const result = [
        { key: "a", visited: [1, 2, 3] },
        { key: "b", visited: [1, 2, 3] },
        { key: "c", visited: [1, 2, 3] },
    ];

    input.forEach(item => composed.write(item));
});

test("compose() writable length should be less than highWaterMark when handing writes", async t => {
    t.plan(7);
    return new Promise(async (resolve, reject) => {
        interface Chunk {
            key: string;
            mapped: number[];
        }
        const first = map(
            async (chunk: Chunk) => {
                chunk.mapped.push(1);
                return chunk;
            },
            {
                objectMode: true,
            },
        );

        const second = map(
            async (chunk: Chunk) => {
                chunk.mapped.push(2);
                return chunk;
            },
            { objectMode: true },
        );

        const composed = compose(
            [first, second],
            { objectMode: true, highWaterMark: 2 },
        );
        composed.on("error", err => {
            reject();
        });

        composed.on("drain", () => {
            t.pass();
            expect(composed._writableState.length).to.be.equal(0);
        });

        composed.on("data", (chunk: Chunk) => {
            if (chunk.key === "e") {
                resolve();
            }
        });

        const input = [
            { key: "a", mapped: [] },
            { key: "b", mapped: [] },
            { key: "c", mapped: [] },
            { key: "d", mapped: [] },
            { key: "e", mapped: [] },
        ];

        for (const item of input) {
            const res = composed.write(item);
            expect(composed._writableState.length).to.be.at.most(2);
            t.pass();
            if (!res) {
                await sleep(10);
            }
        }
    });
});

test("compose() should emit drain event ~rate * highWaterMark ms for every write that causes backpressure", async t => {
    t.plan(7);
    const _rate = 100;
    const highWaterMark = 2;
    return new Promise(async (resolve, reject) => {
        interface Chunk {
            key: string;
            mapped: number[];
        }
        const first = map(
            async (chunk: Chunk) => {
                await sleep(_rate);
                chunk.mapped.push(1);
                return chunk;
            },
            {
                objectMode: true,
            },
        );

        const second = map(
            async (chunk: Chunk) => {
                chunk.mapped.push(2);
                return chunk;
            },
            { objectMode: true },
        );

        const composed = compose(
            [first, second],
            { objectMode: true, highWaterMark },
        );
        composed.on("error", err => {
            reject();
        });

        composed.on("drain", () => {
            t.pass();
            expect(composed._writableState.length).to.be.equal(0);
            expect(performance.now() - start).to.be.closeTo(
                _rate * highWaterMark,
                40,
            );
        });

        composed.on("data", (chunk: Chunk) => {
            pendingReads--;
            if (pendingReads === 0) {
                resolve();
            }
        });

        const input = [
            { key: "a", mapped: [] },
            { key: "b", mapped: [] },
            { key: "c", mapped: [] },
            { key: "d", mapped: [] },
            { key: "e", mapped: [] },
        ];

        let start = performance.now();
        let pendingReads = input.length;
        start = performance.now();
        for (const item of input) {
            const res = composed.write(item);
            expect(composed._writableState.length).to.be.at.most(highWaterMark);
            t.pass();
            if (!res) {
                await sleep(_rate * highWaterMark * 2);
                start = performance.now();
            }
        }
    });
});

test.cb(
    "compose() should emit drain event after 500 ms when writing 5 items that take 100ms to process with a highWaterMark of 5 ",
    t => {
        t.plan(6);
        const _rate = 100;
        interface Chunk {
            key: string;
            mapped: number[];
        }
        const first = map(
            async (chunk: Chunk) => {
                await sleep(_rate);
                chunk.mapped.push(1);
                return chunk;
            },
            {
                objectMode: true,
            },
        );

        const second = map(
            async (chunk: Chunk) => {
                chunk.mapped.push(2);
                return chunk;
            },
            { objectMode: true },
        );

        const composed = compose(
            [first, second],
            { objectMode: true, highWaterMark: 5 },
        );

        composed.on("error", err => {
            t.end(err);
        });

        composed.on("drain", () => {
            expect(composed._writableState.length).to.be.equal(0);
            expect(performance.now() - start).to.be.closeTo(
                _rate * input.length,
                50,
            );
            t.pass();
        });

        composed.on("data", (chunk: Chunk) => {
            t.pass();
            if (chunk.key === "e") {
                t.end();
            }
        });

        const input = [
            { key: "a", mapped: [] },
            { key: "b", mapped: [] },
            { key: "c", mapped: [] },
            { key: "d", mapped: [] },
            { key: "e", mapped: [] },
        ];
        input.forEach(item => {
            composed.write(item);
        });
        const start = performance.now();
    },
);

test.cb(
    "compose() should emit drain event immediately when second stream is bottleneck",
    t => {
        t.plan(6);
        const _rate = 200;
        interface Chunk {
            key: string;
            mapped: number[];
        }
        const first = map(
            (chunk: Chunk) => {
                chunk.mapped.push(1);
                return chunk;
            },
            {
                objectMode: true,
            },
        );

        const second = map(
            async (chunk: Chunk) => {
                pendingReads--;
                await sleep(_rate);
                expect(second._writableState.length).to.be.equal(1);
                expect(first._readableState.length).to.equal(pendingReads);
                chunk.mapped.push(2);
                return chunk;
            },
            { objectMode: true, highWaterMark: 1 },
        );

        const composed = compose(
            [first, second],
            { objectMode: true, highWaterMark: 5 },
        );
        composed.on("error", err => {
            t.end(err);
        });

        composed.on("drain", () => {
            expect(composed._writableState.length).to.be.equal(0);
            expect(performance.now() - start).to.be.lessThan(_rate);
            t.pass();
        });

        composed.on("data", (chunk: Chunk) => {
            expect(composed._writableState.length).to.be.equal(0);
            t.pass();
            if (chunk.key === "e") {
                t.end();
            }
        });

        const input = [
            { key: "a", mapped: [] },
            { key: "b", mapped: [] },
            { key: "c", mapped: [] },
            { key: "d", mapped: [] },
            { key: "e", mapped: [] },
        ];
        let pendingReads = input.length;

        input.forEach(item => {
            composed.write(item);
        });

        const start = performance.now();
    },
);

test.cb(
    "compose() should emit drain event and first should contain up to highWaterMark items in readable state when second is bottleneck",
    t => {
        t.plan(6);
        interface Chunk {
            index: number;
            mapped: string[];
        }
        const first = map(
            async (chunk: Chunk) => {
                expect(first._readableState.length).to.be.at.most(2);
                chunk.mapped.push("first");
                return chunk;
            },
            {
                objectMode: true,
                highWaterMark: 2,
            },
        );

        const second = map(
            async (chunk: Chunk) => {
                expect(second._writableState.length).to.be.equal(1);
                await sleep(100);
                chunk.mapped.push("second");
                return chunk;
            },
            { objectMode: true, highWaterMark: 2 },
        );

        const composed = compose(
            [first, second],
            { objectMode: true, highWaterMark: 5 },
        );
        composed.on("error", err => {
            t.end(err);
        });

        composed.on("data", (chunk: Chunk) => {
            expect(chunk.mapped.length).to.equal(2);
            expect(chunk.mapped).to.deep.equal(["first", "second"]);
            t.pass();
            if (chunk.index === 5) {
                t.end();
            }
        });

        composed.on("drain", () => {
            expect(composed._writableState.length).to.be.equal(0);
            t.pass();
        });

        const input = [
            { index: 1, mapped: [] },
            { index: 2, mapped: [] },
            { index: 3, mapped: [] },
            { index: 4, mapped: [] },
            { index: 5, mapped: [] },
        ];

        input.forEach(item => {
            composed.write(item);
        });
    },
);

test.cb(
    "compose() should not emit drain event writing 5 items to compose with a highWaterMark of 6",
    t => {
        t.plan(5);
        const _rate = 100;
        interface Chunk {
            key: string;
            mapped: number[];
        }
        const first = map(
            async (chunk: Chunk) => {
                await sleep(_rate);
                chunk.mapped.push(1);
                return chunk;
            },
            {
                objectMode: true,
            },
        );

        const second = map(
            async (chunk: Chunk) => {
                chunk.mapped.push(2);
                return chunk;
            },
            { objectMode: true },
        );

        const composed = compose(
            [first, second],
            { objectMode: true, highWaterMark: 6 },
        );

        composed.on("error", err => {
            t.end(err);
        });

        composed.on("drain", () => {
            t.end(new Error("Drain should not be emitted"));
        });

        composed.on("data", (chunk: Chunk) => {
            t.pass();
            if (chunk.key === "e") {
                t.end();
            }
        });

        const input = [
            { key: "a", mapped: [] },
            { key: "b", mapped: [] },
            { key: "c", mapped: [] },
            { key: "d", mapped: [] },
            { key: "e", mapped: [] },
        ];

        input.forEach(item => {
            composed.write(item);
        });
    },
);
