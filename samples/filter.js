const strom = require("stromjs");

strom
    .fromArray(["a", "b", "c"])
    .pipe(strom.filter(s => s !== "b"))
    .pipe(strom.join(","))
    .pipe(process.stdout);
