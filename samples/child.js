const strom = require("strom").strom();
const catProcess = require("child_process").exec("grep -o ab");

strom.fromArray(["a", "b", "c"])
    .pipe(strom.child(catProcess))
    .pipe(process.stdout);
