const test = require("ava");
const { expect } = require("chai");
const { compose, composeDuplex, map, rate } = require("../src");
const { sleep } = require("../src/helpers");
import { performance } from "perf_hooks";

test.cb("compose() chains two streams together in the correct order", t => {
    t.plan(3);
    let i = 0;
    const first = map((chunk: number) => chunk + 1);
    const second = map((chunk: number) => chunk * 2);

    const composed = compose(
        [first, second],
        { objectMode: true },
    );

    composed.on("data", data => {
        expect(data).to.equal(result[i]);
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

    const input = [1, 2, 3];
    const result = [4, 6, 8];

    input.forEach(item => composed.write(item));
});

test.cb(
    "compose() followed by pipe chains streams together in the correct order",
    t => {
        t.plan(3);
        let i = 0;
        const first = map((chunk: number) => chunk + 1);
        const second = map((chunk: number) => chunk * 2);

        const composed = compose(
            [first, second],
            { objectMode: true },
        );
        const third = map((chunk: number) => chunk + 1);
        composed.pipe(third).on("data", data => {
            expect(data).to.equal(result[i]);
            t.pass();
            i++;
            if (i === 3) {
                t.end();
            }
        });

        composed.on("error", err => {
            t.end(err);
        });

        const input = [1, 2, 3];
        const result = [5, 7, 9];

        input.forEach(item => composed.write(item));
    },
);

test.cb(
    "compose() should emit drain event after 1 second when first stream is bottleneck",
    t => {
        t.plan(6);
        interface Chunk {
            index: number;
            mapped: string[];
        }
        const first = map(
            async (chunk: Chunk) => {
                await sleep(200);
                chunk.mapped.push("first");
                return chunk;
            },
            {
                objectMode: true,
            },
        );

        const second = map(
            async (chunk: Chunk) => {
                chunk.mapped.push("second");
                return chunk;
            },
            { objectMode: true },
        );

        const composed = compose(
            [first, second],
            { objectMode: true, highWaterMark: 2 },
        );
        composed.on("error", err => {
            t.end(err);
        });

        composed.on("drain", err => {
            expect(performance.now() - start).to.be.greaterThan(1000);
            t.pass();
        });

        composed.on("data", (chunk: Chunk) => {
            expect(chunk.mapped.length).to.equal(2);
            expect(chunk.mapped).to.deep.equal(["first", "second"]);
            t.pass();
            if (chunk.index === 5) {
                t.end();
            }
        });

        const input = [
            { data: 1 },
            { data: 2 },
            { data: 3 },
            { data: 4 },
            { data: 5 },
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
        interface Chunk {
            index: number;
            mapped: string[];
        }
        const first = map(
            async (chunk: Chunk) => {
                chunk.mapped.push("first");
                return chunk;
            },
            {
                objectMode: true,
            },
        );

        const second = map(
            async (chunk: Chunk) => {
                await sleep(500);
                chunk.mapped.push("second");
                return chunk;
            },
            { objectMode: true },
        );

        const composed = compose(
            [first, second],
            { objectMode: true, highWaterMark: 2 },
        );
        composed.on("error", err => {
            t.end(err);
        });

        composed.on("drain", err => {
            expect(performance.now() - start).to.be.lessThan(100);
            t.pass();
        });

        composed.on("data", (chunk: Chunk) => {
            expect(chunk.mapped.length).to.equal(2);
            expect(chunk.mapped).to.deep.equal(["first", "second"]);
            t.pass();
            if (chunk.index === 5) {
                t.end();
            }
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
            { objectMode: true, highWaterMark: 3 },
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
