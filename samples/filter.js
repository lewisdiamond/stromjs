const Mhysa = require("mhysa");

Mhysa.fromArray(["a", "b", "c"])
    .pipe(Mhysa.filter(s => s !== "b"))
    .pipe(Mhysa.join(","))
    .pipe(process.stdout);
