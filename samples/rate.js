const strom = require("../dist/index.js");

function sleep(time) {
    return time > 0 ? new Promise(resolve => setTimeout(resolve, time)) : null;
}

const rate = strom.rate(2, 1, { behavior: 1 });
rate.pipe(strom.map(x => console.log(x)));
async function produce() {
    rate.write(1);
    await sleep(500);
    rate.write(2);
    await sleep(500);
    rate.write(3);
    rate.write(4);
    rate.write(5);
    await sleep(500);
    rate.write(6);
}

produce();
