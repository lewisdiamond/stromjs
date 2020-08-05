const strom = require("stromjs");

strom
    .fromArray(["a", "b", "cc"])
    .pipe(strom.reduce((acc, s) => ({ ...acc, [s]: s.length }), {}))
    .pipe(strom.stringify())
    .pipe(process.stdout);
