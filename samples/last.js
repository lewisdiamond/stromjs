const strom = require("stromjs");

let f = async () => {
    const source = strom.fromArray(["a", "b", "c"]);
    console.log(await strom.last(source));
};
f();
