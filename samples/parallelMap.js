const strom = require("stromjs");

function sleep(time) {
    return time > 0 ? new Promise(resolve => setTimeout(resolve, time)) : null;
}

strom
    .fromArray([1, 2, 3, 4, 6, 8])
    .pipe(
        strom.parallelMap(async d => {
            await sleep(1000 - d * 100);
            return `${d}`;
        }, 3),
    )
    .pipe(process.stdout);
