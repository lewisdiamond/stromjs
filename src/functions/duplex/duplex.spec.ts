import * as cp from "child_process";
import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { duplex } from "../baseFunctions";

test.cb(
    "duplex() combines a writable and readable stream into a ReadWrite stream",
    t => {
        t.plan(1);
        const source = new Readable();
        const catProcess = cp.exec("cat");
        let out = "";
        source
            .pipe(duplex(catProcess.stdin!, catProcess.stdout!))
            .on("data", chunk => (out += chunk))
            .on("error", t.end)
            .on("end", () => {
                expect(out).to.equal("abcdef");
                t.pass();
                t.end();
            });
        source.push("ab");
        source.push("cd");
        source.push("ef");
        source.push(null);
    },
);
