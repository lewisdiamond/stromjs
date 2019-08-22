const test = require("ava");
const { expect } = require("chai");
const { compose, composeDuplex, map } = require("../src");

test.cb("compose() chains two streams together in the correct order", t => {
    t.plan(3);
    let i = 0;
    const first = map((chunk: number) => chunk + 1);
    const second = map((chunk: number) => chunk * 2);

    const composed = compose(
        [first, second],
        { objectMode: true },
    );

    composed.on("data", data => {
        expect(data).to.equal(result[i]);
        t.pass();
        i++;
        if (i === 3) {
            t.end();
        }
    });
    composed.on("error", err => {
        t.end(err);
    });
    composed.on("end", () => {
        t.end();
    });

    const input = [1, 2, 3];
    const result = [4, 6, 8];

    input.forEach(item => composed.write(item));
});

test.cb(
    "compose() followed by pipe chains streams together in the correct order",
    t => {
        t.plan(3);
        let i = 0;
        const first = map((chunk: number) => chunk + 1);
        const second = map((chunk: number) => chunk * 2);

        const composed = compose(
            [first, second],
            { objectMode: true },
        );
        const third = map((chunk: number) => chunk + 1);
        composed.pipe(third).on("data", data => {
            expect(data).to.equal(result[i]);
            t.pass();
            i++;
            if (i === 3) {
                t.end();
            }
        });

        composed.on("error", err => {
            t.end(err);
        });

        const input = [1, 2, 3];
        const result = [5, 7, 9];

        input.forEach(item => composed.write(item));
    },
);
