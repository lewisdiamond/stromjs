const Mhysa = require("mhysa");
const catProcess = require("child_process").exec("grep -o ab");
Mhysa.fromArray(["a", "b", "c"])
    .pipe(Mhysa.duplex(catProcess.stdin, catProcess.stdout))
    .pipe(process.stdout);
