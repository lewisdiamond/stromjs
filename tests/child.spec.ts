import * as cp from "child_process";
import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import mhysa from "../src";
const { child } = mhysa();

test.cb(
    "child() allows easily writing to child process stdin and reading from its stdout",
    t => {
        t.plan(1);
        const source = new Readable();
        const catProcess = cp.exec("cat");
        let out = "";
        source
            .pipe(child(catProcess))
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
