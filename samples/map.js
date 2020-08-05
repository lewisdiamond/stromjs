const strom = require("stromjs");

strom
    .fromArray(["a", "b"])
    .pipe(strom.map(s => s.toUpperCase()))
    .pipe(strom.join(","))
    .pipe(process.stdout);
