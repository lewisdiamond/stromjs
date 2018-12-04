const Mhysa = require("mhysa");

Mhysa.fromArray(["a,b", "c,d"])
    .pipe(Mhysa.split(","))
    .pipe(Mhysa.join("|"))
    .pipe(process.stdout);
