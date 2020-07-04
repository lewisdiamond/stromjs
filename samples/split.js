const strom = require("strom");

strom.fromArray(["a,b", "c,d"])
    .pipe(strom.split(","))
    .pipe(strom.join("|"))
    .pipe(process.stdout);
