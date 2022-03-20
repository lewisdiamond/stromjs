import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { join } from "../src";

test("join() joins chunks using the specified separator", (t) => {
    t.plan(9);
    const source = new Readable({ objectMode: true });
    const expectedParts = ["ab|", "|", "c|d", "|", "|", "|", "e", "|", "|f|"];
    let i = 0;
    return new Promise((resolve, reject) => {
        source
            .pipe(join("|"))
            .on("data", (part) => {
                expect(part).to.equal(expectedParts[i]);
                t.pass();
                i++;
            })
            .on("error", reject)
            .on("end", resolve);

        source.push("ab|");
        source.push("c|d");
        source.push("|");
        source.push("e");
        source.push("|f|");
        source.push(null);
    });
});

test(
    "join() joins chunks using the specified separator without breaking up multi-byte characters " +
        "spanning multiple chunks",
    (t) => {
        t.plan(5);
        const source = new Readable({ objectMode: true });
        const expectedParts = ["ø", "|", "ö", "|", "一"];
        let i = 0;
        return new Promise((resolve, reject) => {
            source
                .pipe(join("|"))
                .on("data", (part) => {
                    expect(part).to.equal(expectedParts[i]);
                    t.pass();
                    i++;
                })
                .on("error", reject)
                .on("end", resolve);

            source.push(Buffer.from("ø").slice(0, 1)); // 2-byte character spanning two chunks
            source.push(Buffer.from("ø").slice(1, 2));
            source.push(Buffer.from("ö").slice(0, 1)); // 2-byte character spanning two chunks
            source.push(Buffer.from("ö").slice(1, 2));
            source.push(Buffer.from("一").slice(0, 1)); // 3-byte character spanning three chunks
            source.push(Buffer.from("一").slice(1, 2));
            source.push(Buffer.from("一").slice(2, 3));
            source.push(null);
        });
    },
);
