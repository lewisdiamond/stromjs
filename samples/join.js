const strom = require("strom").strom();

strom.fromArray(["a", "b", "c"])
    .pipe(strom.join(","))
    .pipe(process.stdout);
