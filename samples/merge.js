const { Readable } = require("stream");
const strom = require("strom").strom();

const source1 = new Readable({ read() {} });
const source2 = new Readable({ read() {} });
strom.merge(source1, source2).pipe(process.stdout);
source1.push("a1 ");
setTimeout(() => source2.push("c3 "), 10);
setTimeout(() => source1.push("b2 "), 20);
setTimeout(() => source2.push("d4 "), 30);
setTimeout(() => source1.push(null), 40);
setTimeout(() => source2.push(null), 50);
