# mhysa

**Promise, Stream and EventEmitter utils for Node.js**

## Installation

```sh
yarn add mhysa
```

## Basic Usage

The following snippet demonstrates most of mhysa's current features. More will come!

```js
const { sleep, once, delay, every, stream } = require("mhysa");

async function main() {
    const collector = stream
        .concat(
            stream.fromArray(["a\n", "b\n", "c\n"]), 
            stream.fromArray(["d", "e"]).pipe(stream.join("-"))
        )
        .pipe(stream.split("\n"))
        .pipe(stream.flatMap(s => [s, s.toUpperCase()]))
        .pipe(stream.collect({ objectMode: true }));

    const collected = await once(collector, "data");
    await sleep(1000); // undefined (after one second)
    await delay(collected, 1000); // [ 'a', 'A', 'b', 'B', 'c', 'C', 'd-e', 'D-E' ] (after another second)
    await every(
        [Promise.resolve("ab"), delay("cd", 1000)], 
        s => s.length === 2
    ); // true (after another second)
    await every(
        [Promise.resolve("ab"), delay("cd", 1000)], 
        s => s.length === 1
    ); // false (instantly)
}
main();
```

## API

### { stream }

```ts
/**
 * Convert an array into a readable stream of its elements
 * @param array The array of elements to stream
 */
export declare function fromArray(array: any[]): NodeJS.ReadableStream;

/**
 * Return a ReadWrite stream that maps streamed chunks
 * @param mapper The mapper function, mapping each (chunk, encoding) to a new chunk (or a promise of such)
 * @param options
 * @param options.readableObjectMode Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode Whether this stream should behave as a writable stream of objects
 */
export declare function map<T, R>(
    mapper: (chunk: T, encoding: string) => R,
    {
        readableObjectMode,
        writableObjectMode,
    }?: {
        readableObjectMode?: boolean | undefined;
        writableObjectMode?: boolean | undefined;
    },
): NodeJS.ReadWriteStream;

/**
 * Return a ReadWrite stream that flat maps streamed chunks
 * @param mapper The mapper function, mapping each (chunk, encoding) to an array of new chunks (or a promise of such)
 * @param options
 * @param options.readableObjectMode Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode Whether this stream should behave as a writable stream of objects
 */
export declare function flatMap<T, R>(
    mapper:
        | ((chunk: T, encoding: string) => R[])
        | ((chunk: T, encoding: string) => Promise<R[]>),
    {
        readableObjectMode,
        writableObjectMode,
    }?: {
        readableObjectMode?: boolean | undefined;
        writableObjectMode?: boolean | undefined;
    },
): NodeJS.ReadWriteStream;

/**
 * Return a ReadWrite stream that splits streamed chunks using the given separator
 * @param separator The separator to split by, defaulting to "\n"
 */
export declare function split(separator?: string): NodeJS.ReadWriteStream;

/**
 * Return a ReadWrite stream that joins streamed chunks using the given separator
 * @param separator The separator to join with
 */
export declare function join(separator: string): NodeJS.ReadWriteStream;

/**
 * Return a ReadWrite stream that collects streamed objects or bytes into an array or buffer
 * @param options
 * @param options.objectMode Whether this stream should behave as a stream of objects
 */
export declare function collect({
    objectMode,
}?: {
    objectMode?: boolean | undefined;
}): NodeJS.ReadWriteStream;

/**
 * Return a stream of readable streams concatenated together
 * @param streams The readable streams to concatenate
 */
export declare function concat(
    ...streams: NodeJS.ReadableStream[]
): NodeJS.ReadableStream;
```

### mhysa

```ts
/**
 * Resolve after the given delay in milliseconds
 *
 * @param ms The number of milliseconds to wait
 */
export declare function sleep(ms: number): Promise<{}>;

/**
 * Resolve a value after the given delay in milliseconds
 *
 * @param value Value to resolve
 * @param ms Number of milliseconds to wait
 */
export declare function delay<T>(value: T, ms: number): Promise<T>;

/**
 * Resolve once the given event emitter emits the specified event
 *
 * @param emitter Event emitter to watch
 * @param event Event to watch
 */
export declare function once<T>(
    emitter: NodeJS.EventEmitter,
    event: string,
): Promise<T>;

/**
 * Eagerly resolve to false as soon as any of the promises has resolved to a value for which the
 * predicate is falsey, or resolve to true when all of the promises have resolved to a value for which
 * the predicate is thruthy, or rejects with the reason of the first promise rejection
 *
 * @param promises Promises whose resolved values will be tested by the predicate
 * @param predicate Predicate to apply
 * @returns Promise indicating whether the predicate holds for all resolved promise values
 */
export declare function every<T>(
    promises: Array<Promise<T>>,
    predicate: (value: T) => boolean,
): Promise<boolean>;
```
