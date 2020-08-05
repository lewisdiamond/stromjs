const strom = require("stromjs");

strom
    .fromArray(["a", "b", "c"])
    .pipe(strom.join(","))
    .pipe(process.stdout);
