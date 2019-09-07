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
        let passedBottleneck = 0;
        interface Chunk {
            index: number;
            mapped: string[];
        }
        const first = map(
            async (chunk: Chunk) => {
                await sleep(200);
                passedBottleneck++;
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
            { objectMode: true, highWaterMark: 5 },
        );
        composed.on("error", err => {
            t.end(err);
        });

        composed.on("drain", err => {
            expect(composed._writableState.length).to.be.equal(0);
            expect(performance.now() - start).to.be.greaterThan(1000);
            t.pass();
        });

        composed.on("data", (chunk: Chunk) => {
            // Since first is bottleneck, composed accumulates until cb is executed in first. Therefore buffer should contain 4, 3, 2, 1 then 0 elements
            expect(composed._writableState.length).to.be.equal(
                input.length - passedBottleneck,
            );
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
                pendingReads--;
                await sleep(500);
                expect(first._readableState.length).to.equal(pendingReads);
                chunk.mapped.push("second");
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

        composed.on("drain", err => {
            expect(composed._writableState.length).to.be.equal(0);
            expect(performance.now() - start).to.be.lessThan(100);
            t.pass();
        });

        composed.on("data", (chunk: Chunk) => {
            // Since second is bottleneck, composed will write into first immediately. Buffer should be empty.
            expect(composed._writableState.length).to.be.equal(0);
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
