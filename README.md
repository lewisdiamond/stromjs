# Mhysa

**Streams and event emitter utils for Node.js**

## Installation

```sh
yarn add mhysa
```

## Basic Usage

The following snippet demonstrates most of Mhysa's current features without much explanation. More 
will come!

```js
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
```

## API

```ts
/**
 * Convert an array into a readable stream of its elements
 * @param array The array of elements to stream
 */
fromArray(array: any[]): NodeJS.ReadableStream;

/**
 * Return a ReadWrite stream that maps streamed chunks
 * @param mapper The mapper function, mapping each (chunk, encoding) to a new chunk (or a promise of such)
 * @param options
 * @param options.readableObjectMode Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode Whether this stream should behave as a writable stream of objects
 */
map<T, R>(
    mapper: (chunk: T, encoding: string) => R,
    options?: ThroughOptions,
): NodeJS.ReadWriteStream;

/**
 * Return a ReadWrite stream that flat maps streamed chunks
 * @param mapper The mapper function, mapping each (chunk, encoding) to an array of new chunks (or a promise of such)
 * @param options
 * @param options.readableObjectMode Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode Whether this stream should behave as a writable stream of objects
 */
flatMap<T, R>(
    mapper:
        | ((chunk: T, encoding: string) => R[])
        | ((chunk: T, encoding: string) => Promise<R[]>),
    options?: ThroughOptions,
): NodeJS.ReadWriteStream;

/**
 * Return a ReadWrite stream that splits streamed chunks using the given separator
 * @param separator The separator to split by, defaulting to "\n"
 */
split(
    separator?: string | RegExp,
): NodeJS.ReadWriteStream;

/**
 * Return a ReadWrite stream that joins streamed chunks using the given separator
 * @param separator The separator to join with
 */
join(separator: string): NodeJS.ReadWriteStream;

/**
 * Return a ReadWrite stream that collects streamed chunks into an array or buffer
 * @param options
 * @param options.objectMode Whether this stream should behave as a stream of objects
 */
collect(
    options?: ReadableOptions,
): NodeJS.ReadWriteStream;

/**
 * Return a stream of readable streams concatenated together
 * @param streams The readable streams to concatenate
 */
concat(
    ...streams: NodeJS.ReadableStream[]
): NodeJS.ReadableStream;

```

### Interfaces

```ts
interface ReadableOptions {
    objectMode?: boolean;
}

interface ThroughOptions {
    readableObjectMode?: boolean;
    writableObjectMode?: boolean;
}
```

### { utils }

```ts
/**
 * Resolve after the given delay in milliseconds
 *
 * @param ms The number of milliseconds to wait
 */
sleep(ms: number): Promise<{}>;

/**
 * Resolve a value after the given delay in milliseconds
 *
 * @param value Value to resolve
 * @param ms Number of milliseconds to wait
 */
delay<T>(value: T, ms: number): Promise<T>;

/**
 * Resolve once the given event emitter emits the specified event
 *
 * @param emitter Event emitter to watch
 * @param event Event to watch
 */
once<T>(
    emitter: NodeJS.EventEmitter,
    event: string,
): Promise<T>;
```
