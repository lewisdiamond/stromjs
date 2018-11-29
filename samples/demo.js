const {
    utils: { sleep, delay, once },
    ...Mhysa
} = require("mhysa");

async function main() {
    const collector = Mhysa.concat(
        Mhysa.fromArray(["a\n", "b\n", "c\n"]),
        Mhysa.fromArray(["d", "e"]).pipe(Mhysa.join("-")),
    )
        .pipe(Mhysa.split("\n"))
        .pipe(
            Mhysa.flatMap(async s => {
                await sleep(100);
                return delay([s, s.toUpperCase()], 100);
            }),
        )
        .pipe(Mhysa.collect({ objectMode: true }));

    const collected = await once(collector, "data");
    console.log(collected); // [ 'a', 'A', 'b', 'B', 'c', 'C', 'd-e', 'D-E' ] (after 6 * 100 ms)
}
main();
