const strom = require("stromjs");

strom
    .fromArray(["a", "b", "c"])
    .pipe(strom.map(s => Promise.resolve(s + s)))
    .pipe(strom.flatMap(s => Promise.resolve([s, s.toUpperCase()])))
    .pipe(strom.filter(s => Promise.resolve(s !== "bb")))
    .pipe(strom.join(","))
    .pipe(process.stdout);
