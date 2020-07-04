const strom = require("strom").strom();

strom.fromArray(['{ "a": "b" }'])
    .pipe(strom.parse())
    .on("data", object => console.log(object));
