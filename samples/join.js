const Mhysa = require("mhysa");

Mhysa.fromArray(["a", "b", "c"])
    .pipe(Mhysa.join(","))
    .pipe(process.stdout);
