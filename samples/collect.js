const Mhysa = require("mhysa");

Mhysa.fromArray(["a", "b", "c"])
    .pipe(Mhysa.collect({ objectMode: true }))
    .on("data", object => console.log(object));
