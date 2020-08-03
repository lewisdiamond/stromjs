import * as test from "ava";
import { expect } from "chai";
import { sleep } from "../src/helpers";
import { Readable, Writable } from "stream";
import { compose, map, fromArray } from "../src";
import { performance } from "perf_hooks";

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

    const composed = compose([first, second]);

    composed.on("data", data => {
        expect(data).to.deep.equal(result[i]);
        t.pass();
        i++;
        if (i === 3) {
            t.end();
        }
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

    const composed = compose([first, second]);
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
    t.plan(2);
    return new Promise(async (resolve, reject) => {
        interface Chunk {
            key: string;
            mapped: number[];
        }
        const first = map(async (chunk: Chunk) => {
            chunk.mapped.push(1);
            return chunk;
        });

        const second = map(async (chunk: Chunk) => {
            chunk.mapped.push(2);
            return chunk;
        });

        const composed = compose([first, second], undefined, {
            highWaterMark: 2,
        });
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

        fromArray(input).pipe(composed);
    });
});

test("compose() should emit drain event ~rate * highWaterMark ms for every write that causes backpressure", async t => {
    t.plan(2);
    const _rate = 100;
    const highWaterMark = 2;
    return new Promise(async (resolve, reject) => {
        interface Chunk {
            key: string;
            mapped: number[];
        }
        const first = map(async (chunk: Chunk) => {
            await sleep(_rate);
            chunk.mapped.push(1);
            return chunk;
        });

        const second = map(async (chunk: Chunk) => {
            chunk.mapped.push(2);
            return chunk;
        });

        const composed = compose([first, second], undefined, {
            highWaterMark,
        });
        composed.on("error", err => {
            reject();
        });

        composed.on("drain", () => {
            t.pass();
            expect(composed._writableState.length).to.be.equal(0);
        });

        composed.on("data", (chunk: Chunk) => {
            t.deepEqual(chunk.mapped, [1, 2]);
        });

        composed.on("finish", () => resolve());

        const input = [
            { key: "a", mapped: [] },
            { key: "b", mapped: [] },
            { key: "c", mapped: [] },
            { key: "d", mapped: [] },
            { key: "e", mapped: [] },
        ];
        fromArray(input).pipe(composed);
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
        const first = map(async (chunk: Chunk) => {
            await sleep(_rate);
            chunk.mapped.push(1);
            return chunk;
        });

        const second = map(async (chunk: Chunk) => {
            chunk.mapped.push(2);
            return chunk;
        });

        const composed = compose([first, second], undefined, {
            highWaterMark: 5,
        });

        composed.on("error", err => {
            t.end(err);
        });

        composed.on("drain", () => {
            expect(composed._writableState.length).to.be.equal(0);
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
        const first = map((chunk: Chunk) => {
            chunk.mapped.push(1);
            return chunk;
        });

        const second = map(
            async (chunk: Chunk) => {
                pendingReads--;
                await sleep(_rate);
                expect(second._writableState.length).to.be.equal(1);
                expect(first._readableState.length).to.equal(pendingReads);
                chunk.mapped.push(2);
                return chunk;
            },
            { highWaterMark: 1 },
        );

        const composed = compose([first, second], undefined, {
            highWaterMark: 5,
        });
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
            { highWaterMark: 2 },
        );

        const composed = compose([first, second], undefined, {
            highWaterMark: 5,
        });
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
        const first = map(async (chunk: Chunk) => {
            await sleep(_rate);
            chunk.mapped.push(1);
            return chunk;
        });

        const second = map(async (chunk: Chunk) => {
            chunk.mapped.push(2);
            return chunk;
        });

        const composed = compose([first, second], undefined, {
            highWaterMark: 6,
        });

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

test.cb("compose() should be 'destroyable'", t => {
    t.plan(3);
    const _sleep = 100;
    interface Chunk {
        key: string;
        mapped: number[];
    }

    const first = map(async (chunk: Chunk) => {
        await sleep(_sleep);
        chunk.mapped.push(1);
        return chunk;
    });

    const second = map(async (chunk: Chunk) => {
        chunk.mapped.push(2);
        return chunk;
    });

    const composed = compose([first, second], (err: any) => {
        t.pass();
    });

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
            t.deepEqual(cur.mapped, [1, 2]);
            if (cur.key === "a") {
                composed.destroy();
            }
            cb();
        },
    });

    composed.on("close", t.end);
    fakeSource.pipe(composed).pipe(fakeSink);

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

test.cb("compose() `finish` and `end` propagates", t => {
    interface Chunk {
        key: string;
        mapped: number[];
    }

    t.plan(8);
    const first = map(async (chunk: Chunk) => {
        chunk.mapped.push(1);
        return chunk;
    });

    const second = map(async (chunk: Chunk) => {
        chunk.mapped.push(2);
        return chunk;
    });

    const composed = compose([first, second], undefined, {
        highWaterMark: 3,
    });

    const fakeSource = new Readable({
        objectMode: true,
        read() {
            return;
        },
    });
    const sink = map((d: Chunk) => {
        const curr = input.shift();
        t.is(curr.key, d.key);
        t.deepEqual(d.mapped, [1, 2]);
    });

    fakeSource.pipe(composed).pipe(sink);

    fakeSource.on("end", () => {
        t.pass();
    });
    composed.on("finish", () => {
        t.pass();
    });
    composed.on("end", () => {
        t.pass();
        t.end();
    });
    sink.on("finish", () => {
        t.pass();
    });

    const input = [
        { key: "a", mapped: [] },
        { key: "b", mapped: [] },
        { key: "c", mapped: [] },
        { key: "d", mapped: [] },
        { key: "e", mapped: [] },
    ];
    fakeSource.push(input[0]);
    fakeSource.push(input[1]);
    fakeSource.push(null);
});
