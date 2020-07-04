const strom = require("strom").strom();

let f = async () => {
    const source = strom.fromArray(["a", "b", "c"]);
    console.log(await strom.last(source));
};
f();
