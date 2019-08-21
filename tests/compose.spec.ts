const test = require("ava");
const { compose, map } = require("../src");

test.cb("compose()", t => {
    const first = map((chunk: number) => chunk * 2);
    const second = map((chunk: number) => chunk + 1);

    const composed = compose(
        [first, second],
        { objectMode: true },
    );

    composed.write(1);
    composed.write(2);
    composed.write(3);

    composed.on("data", data => {
        console.log("DATA", data);
    });
});
