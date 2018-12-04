const Mhysa = require("mhysa");
const catProcess = require("child_process").exec("grep -o ab");

Mhysa.fromArray(["a", "b", "c"])
    .pipe(Mhysa.child(catProcess))
    .pipe(process.stdout);
