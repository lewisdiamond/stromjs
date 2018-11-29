const { sleep, once, delay, stream } = require("mhysa");

async function main() {
    const collector = stream
        .concat(
            stream.fromArray(["a\n", "b\n", "c\n"]),
            stream.fromArray(["d", "e"]).pipe(stream.join("-")),
        )
        .pipe(stream.split("\n"))
        .pipe(
            stream.flatMap(async s => {
                await sleep(100);
                return delay([s, s.toUpperCase()], 100);
            }),
        )
        .pipe(stream.collect({ objectMode: true }));

    const collected = await once(collector, "data");
    console.log(collected); // [ 'a', 'A', 'b', 'B', 'c', 'C', 'd-e', 'D-E' ] (after 6 * 100 ms)
}
main();
