const { Readable } = require("stream");
const Mhysa = require("mhysa");

const source1 = new Readable();
const source2 = new Readable();
const expectedElements = ["a", "b", "c", "d"];
let i = 0;
Mhysa.concat(source1, source2).pipe(process.stdout);

source1.push("a");
source2.push("c");
source1.push("b");
source2.push("d");
source1.push(null);
source2.push(null);
