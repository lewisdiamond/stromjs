const { Readable } = require("stream");
const Mhysa = require("mhysa");

const source1 = new Readable();
const source2 = new Readable();
Mhysa.concat(source1, source2).pipe(process.stdout);
source1.push("a1 ");
source2.push("c3 ");
source1.push("b2 ");
source2.push("d4 ");
source1.push(null);
source2.push(null);
