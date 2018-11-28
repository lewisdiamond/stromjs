const { sleep, once, delay, every, stream } = require("mhysa");

async function main() {
    const collector = stream
        .concat(
            stream.fromArray(["a\n", "b\n", "c\n"]),
            stream.fromArray(["d", "e"]).pipe(stream.join("-")),
        )
        .pipe(stream.split("\n"))
        .pipe(stream.flatMap(s => [s, s.toUpperCase()]))
        .pipe(stream.collect({ objectMode: true }));

    const collected = await once(collector, "data");
    await sleep(1000); // undefined (after one second)
    console.log(await delay(collected, 1000)); // [ 'a', 'A', 'b', 'B', 'c', 'C', 'd-e', 'D-E' ] (after another second)
    await every(
        [Promise.resolve("ab"), delay("cd", 1000)],
        s => s.length === 2,
    ); // true (after another second)
    await every(
        [Promise.resolve("ab"), delay("cd", 1000)],
        s => s.length === 1,
    ); // false (instantly)
}
main();
