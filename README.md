# mysah

Promise, Stream and EventEmitter utils for Node.js

## Installation

```sh
yarn add mysah
```

## Basic Usage

```js
const { once, sleep, stream } = require("mysah");

async function main() {
    const collector = stream
        .concat(
            stream.fromArray(["a", "b", "c"]), 
            stream.fromArray(["d", "e"])
        )
        .pipe(stream.collect({ objectMode: true }));

    const collected = await once(collector, "data");
    console.log(collected); // [ 'a', 'b', 'c', 'd', 'e' ]
    await sleep(1000); // Resolve after one second
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

### mysah

```ts
/**
 * Resolve after the given delay in milliseconds
 *
 * @param ms - The number of milliseconds to wait
 */
export declare function sleep(ms: number): Promise<{}>;
/**
 * Resolve once the given event emitter emits the specified event
 *
 * @param emitter - The event emitter to watch
 * @param event - The event to watch
 */
export declare function once<T>(emitter: NodeJS.EventEmitter, event: string): Promise<T>;
```
