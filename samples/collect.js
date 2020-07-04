const strom = require("strom").strom();

strom.fromArray(["a", "b", "c"])
    .pipe(strom.collect({ objectMode: true }))
    .on("data", object => console.log(object));
