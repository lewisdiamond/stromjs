const strom = require("stromjs");

strom
    .fromArray(['{ "a": "b" }'])
    .pipe(strom.parse())
    .on("data", object => console.log(object));
