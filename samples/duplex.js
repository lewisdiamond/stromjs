const strom = require("stromjs");
const catProcess = require("child_process").exec("grep -o ab");

strom
    .fromArray(["a", "b", "c"])
    .pipe(strom.duplex(catProcess.stdin, catProcess.stdout))
    .pipe(process.stdout);
