const Mhysa = require("mhysa");

Mhysa.fromArray(["a", "b", "c"])
    .pipe(Mhysa.map(s => Promise.resolve(s + s)))
    .pipe(Mhysa.flatMap(s => Promise.resolve([s, s.toUpperCase()])))
    .pipe(Mhysa.filter(s => Promise.resolve(s !== "bb")))
    .pipe(Mhysa.join(","))
    .pipe(process.stdout);
