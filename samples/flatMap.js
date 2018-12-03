const Mhysa = require("mhysa");

Mhysa.fromArray(["a", "AA"])
    .pipe(Mhysa.flatMap(s => new Array(s.length).fill(s)))
    .pipe(Mhysa.join(","))
    .pipe(process.stdout);
