const strom = require("strom");

strom.fromArray(["a1", "b22", "c333"])
    .pipe(strom.replace(/b\d+/, "B"))
    .pipe(process.stdout);
