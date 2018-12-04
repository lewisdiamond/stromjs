const Mhysa = require("mhysa");

Mhysa.fromArray(["a1", "b22", "c333"])
    .pipe(Mhysa.replace(/b\d+/, "B"))
    .pipe(process.stdout);
