import test from "ava";
import { expect } from "chai";
import { demux, map } from "../src";

interface Test {
    key: string;
    val: number;
}
test.cb("should spread per key", t => {
    t.plan(5);
    const input = [
        { key: "a", val: 1 },
        { key: "a", val: 2 },
        { key: "b", val: 3 },
        { key: "c", val: 4 },
    ];
    const results = [
        { key: "a", val: 2 },
        { key: "a", val: 3 },
        { key: "b", val: 4 },
        { key: "c", val: 5 },
    ];
    const destKeys = [];
    const dests = [];
    let i = 0;

    const construct = (destKey: string) => {
        destKeys.push(destKey);
        const dest = map((chunk: Test) => ({
            ...chunk,
            val: chunk.val + 1,
        }))
            .on("data", (d: Test) => {
                expect(results).to.deep.include(d);
                t.pass();
            })
            .on("end", () => {
                i++;
                if (i === dests.length) {
                    t.end();
                }
            });
        dests.push(dest);
        return dest;
    };

    const demuxed = demux(construct, { key: "key" }, { objectMode: true });
    demuxed.on("finish", () => {
        expect(destKeys).to.deep.equal(["a", "b", "c"]);
        t.pass();
        dests.forEach(dest => dest.end());
    });

    input.forEach(event => demuxed.write(event));
    demuxed.end();
});

test.cb("should spread per key using keyBy", t => {
    t.plan(5);
    const input = [
        { key: "a", val: 1 },
        { key: "a", val: 2 },
        { key: "b", val: 3 },
        { key: "c", val: 4 },
    ];
    const results = [
        { key: "a", val: 2 },
        { key: "a", val: 3 },
        { key: "b", val: 4 },
        { key: "c", val: 5 },
    ];
    const destKeys = [];
    const dests = [];
    let i = 0;

    const construct = (destKey: string) => {
        destKeys.push(destKey);
        const dest = map((chunk: Test) => ({
            ...chunk,
            val: chunk.val + 1,
        }))
            .on("data", (d: Test) => {
                expect(results).to.deep.include(d);
                t.pass();
            })
            .on("end", () => {
                i++;
                if (i === dests.length) {
                    t.end();
                }
            });
        dests.push(dest);
        return dest;
    };

    const demuxed = demux(
        construct,
        { keyBy: (chunk: any) => chunk.key },
        { objectMode: true },
    );
    demuxed.on("finish", () => {
        expect(destKeys).to.deep.equal(["a", "b", "c"]);
        t.pass();
        dests.forEach(dest => dest.end());
    });

    input.forEach(event => demuxed.write(event));
    demuxed.end();
});
