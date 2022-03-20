import * as cp from "child_process";
import { Readable } from "stream";
import test from "ava";
import { expect } from "chai";
import { child } from "../src";

test("child() allows easily writing to child process stdin and reading from its stdout", (t) => {
    t.plan(1);
    const source = new Readable();
    const catProcess = cp.exec("cat");
    let out = "";
    return new Promise((resolve, reject) => {
        source
            .pipe(child(catProcess))
            .on("data", (chunk) => (out += chunk))
            .on("error", reject)
            .on("end", () => {
                expect(out).to.equal("abcdef");
                t.pass();
                resolve();
            });
        source.push("ab");
        source.push("cd");
        source.push("ef");
        source.push(null);
    });
});
