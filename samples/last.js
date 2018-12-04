const Mhysa = require("mhysa");

let f = async () => {
    const source = Mhysa.fromArray(["a", "b", "c"]);
    console.log(await Mhysa.last(source));
};
f();
