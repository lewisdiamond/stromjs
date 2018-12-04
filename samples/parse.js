const Mhysa = require("mhysa");

Mhysa.fromArray(['{ "a": "b" }'])
    .pipe(Mhysa.parse())
    .on("data", object => console.log(object));
