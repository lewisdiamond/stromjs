const test = require("ava");
const { compose, composeDuplex, map } = require("../src");

test.cb("compose()", t => {
    const first = map((chunk: number) => chunk + "x");
    const second = map((chunk: number) => chunk + "y");

    const composed = compose(
        [first, second],
        { objectMode: true },
    );
    const third = map((chunk: number) => chunk + "z");
    composed
        .pipe(third)
        .on("data", data => console.log("Piped composed: ", data));

    composed.on("data", data => {
        console.log("data on composed", data);
        t.end();
    });
    composed.on("error", data => {
        console.log("ERROR", data);
    });
    composed.on("end", data => {
        console.log("end", data);
    });

    composed.write(1);
    composed.write(2);
});
test.cb.only("composeDuplex()", t => {
    const first = map((chunk: number) => chunk + "x");
    const second = map((chunk: number) => chunk + "y");

    const composed = composeDuplex([first, second], { objectMode: true });
    const third = map((chunk: number) => chunk + "z");
    // composed
    // .pipe(third)
    // .on("data", data => console.log("Piped composed: ", data));

    composed.on("data", data => {
        console.log("data on composed", data);
        t.end();
    });
    composed.on("error", data => {
        console.log("ERROR", data);
    });
    composed.on("end", data => {
        console.log("end", data);
    });

    composed.write(1);
    composed.write(2);
});
