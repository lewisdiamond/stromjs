const Mhysa = require("mhysa");

Mhysa.fromArray(["a", "b", "cc"])
    .pipe(Mhysa.reduce((acc, s) => ({ ...acc, [s]: s.length }), {}))
    .pipe(process.stdout);
