const Mhysa = require("mhysa");

Mhysa.fromArray(["a", "b"])
    .pipe(Mhysa.map(s => s.toUpperCase()))
    .pipe(Mhysa.join(","))
    .pipe(process.stdout);
