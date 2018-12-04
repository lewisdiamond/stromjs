const Mhysa = require("mhysa");

Mhysa.fromArray([{ a: "b" }])
    .pipe(Mhysa.stringify())
    .pipe(process.stdout);
