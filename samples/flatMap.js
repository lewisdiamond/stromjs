const strom = require("strom").strom();

strom.fromArray(["a", "AA"])
    .pipe(strom.flatMap(s => new Array(s.length).fill(s)))
    .pipe(strom.join(","))
    .pipe(process.stdout);
