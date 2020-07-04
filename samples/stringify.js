const strom = require("strom").strom();

strom.fromArray([{ a: "b" }])
    .pipe(strom.stringify())
    .pipe(process.stdout);
