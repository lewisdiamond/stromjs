const strom = require("stromjs");

strom
    .fromArray(["a", "b", "c"])
    .pipe(strom.collect({ objectMode: true }))
    .on("data", object => console.log(object));
