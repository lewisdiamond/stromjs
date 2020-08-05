const strom = require("stromjs").strom();

function sleep(time) {
    return time > 0 ? new Promise(resolve => setTimeout(resolve, time)) : null;
}

strom
    .fromArray([1, 2, 3, 4, 6, 8])
    .pipe(
        strom.parallelMap(async d => {
            await sleep(10000 - d * 1000);
            return `${d}`;
        }, 3),
    )
    .pipe(process.stdout);
