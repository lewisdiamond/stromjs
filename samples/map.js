const strom = require("strom").strom();

strom.fromArray(["a", "b"])
    .pipe(strom.map(s => s.toUpperCase()))
    .pipe(strom.join(","))
    .pipe(process.stdout);
