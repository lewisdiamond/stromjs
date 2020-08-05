const strom = require("stromjs");

strom
    .fromArray([{ a: "b" }])
    .pipe(strom.stringify())
    .pipe(process.stdout);
