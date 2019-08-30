import test from "ava";
import { expect } from "chai";
import { demux, map } from "../src";
import { Writable } from "stream";

interface Test {
    key: string;
    val: number;
}
test.cb("should spread per key", t => {
    t.plan(5);
    const input = [
        { key: "a", val: 1 },
        { key: "b", val: 2 },
        { key: "a", val: 3 },
        { key: "c", val: 4 },
    ];
    const results = [
        { key: "a", val: 2 },
        { key: "b", val: 3 },
        { key: "a", val: 4 },
        { key: "c", val: 5 },
    ];
    const destinationStreamKeys = [];
    let i = 0;
    const sink = new Writable({
        objectMode: true,
        write(chunk, enc, cb) {
            expect(results).to.deep.include(chunk);
            expect(input).to.not.deep.include(chunk);
            t.pass();
            cb();
        },
    });
    const construct = (destKey: string) => {
        destinationStreamKeys.push(destKey);
        const dest = map((chunk: Test) => {
            return {
                ...chunk,
                val: chunk.val + 1,
            };
        });

        dest.pipe(sink);
        return dest;
    };

    const demuxed = demux(construct, { key: "key" }, { objectMode: true });
    demuxed.on("finish", () => {
        expect(destinationStreamKeys).to.deep.equal(["a", "b", "c"]);
        t.pass();
        t.end();
    });

    input.forEach(event => demuxed.write(event));
    demuxed.end();
});

test.cb("should spread per key using keyBy", t => {
    t.plan(5);
    const input = [
        { key: "a", val: 1 },
        { key: "b", val: 2 },
        { key: "a", val: 3 },
        { key: "c", val: 4 },
    ];
    const results = [
        { key: "a", val: 2 },
        { key: "b", val: 3 },
        { key: "a", val: 4 },
        { key: "c", val: 5 },
    ];
    const destinationStreamKeys = [];
    const sink = new Writable({
        objectMode: true,
        write(chunk, enc, cb) {
            expect(results).to.deep.include(chunk);
            expect(input).to.not.deep.include(chunk);
            t.pass();
            cb();
        },
    });
    const construct = (destKey: string) => {
        destinationStreamKeys.push(destKey);
        const dest = map((chunk: Test) => {
            return {
                ...chunk,
                val: chunk.val + 1,
            };
        });

        dest.pipe(sink);
        return dest;
    };

    const demuxed = demux(
        construct,
        { keyBy: (chunk: any) => chunk.key },
        { objectMode: true },
    );
    demuxed.on("finish", () => {
        expect(destinationStreamKeys).to.deep.equal(["a", "b", "c"]);
        t.pass();
        t.end();
    });

    input.forEach(event => demuxed.write(event));
    demuxed.end();
});

test.cb("should emit errors", t => {
    t.plan(2);
    const input = [
        { key: "a", val: 1 },
        { key: "b", val: 2 },
        { key: "a", val: 3 },
        { key: "a", val: 4 },
    ];
    const results = [
        { key: "a", val: 2 },
        { key: "b", val: 3 },
        { key: "a", val: 4 },
        { key: "a", val: 5 },
    ];
    const destinationStreamKeys = [];
    const sink = new Writable({
        objectMode: true,
        write(chunk, enc, cb) {
            expect(results).to.deep.include(chunk);
            expect(input).to.not.deep.include(chunk);
            t.pass();
            cb();
        },
    }).on("unpipe", e => console.log("sink err"));

    const construct = (destKey: string) => {
        destinationStreamKeys.push(destKey);
        const dest = map((chunk: Test) => {
            if (chunk.key === "b") {
                throw new Error("Caught object with key 'b'");
            }
            return {
                ...chunk,
                val: chunk.val + 1,
            };
        }).on("error", e => console.log("got err"));

        dest.pipe(sink);
        return dest;
    };

    const demuxed = demux(
        construct,
        { keyBy: (chunk: any) => chunk.key },
        { objectMode: true },
    );
    demuxed.on("error", e => {
        expect(e.message).to.equal("Caught object with key 'b'");
        t.pass();
        t.end();
    });
    input.forEach(event => demuxed.write(event));
    demuxed.end();
});
