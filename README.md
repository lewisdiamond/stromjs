![image](https://img.shields.io/npm/v/stromjs) ![image](https://img.shields.io/npm/dw/stromjs) ![image](https://github.com/lewisdiamond/stromjs/actions/workflows/node.js.yml/badge.svg)

# Strom

**Dependency-free stream utils for Node.js**

<sub>Released under the [MIT](LICENSE) license.</sub>

## Installation

```sh
yarn add stromjs
```
```sh
npm add stromjs
```

## Usage

### CommonJS
```js
const strom = require("stromjs")
process.stdin.pipe(strom.map(...))
```
```js
const {map} = require("stromjs")
process.stdin.pipe(map(...))
```

### Module
```js
import strom from "stromjs"
process.stdin.pipe(strom.map(...))
```
```js
import {map} from "stromjs"
process.stdin.pipe(map(...))
```

### Override default options
```js
import {instance} from "stromjs"
const strom = instance({objectMode: false})
```
or
```js
const strom = require("stromjs").instance({objectMode: false})
```

See [instance(defaultOptions)](#instancedefaultOptions) for details.

## API

- [accumulator(flushStrategy, iteratee, options)](#accumulatorflushStrategy-iteratee-options)
- [batch(batchSize, maxBatchAge, options)](#batchbatchSize-maxBatchAge-options)
- [child(childProcess)](#childchildProcess)
- [collect(options)](#collectoptions)
- [compose(streams, errorCb, options)](#composestreams-errorCb-options)
- [concat(streams)](#concatstreams)
- [demux(pipelineConstructor, demuxBy, options)](#demuxpipelineConstructor-demuxBy-options)
- [duplex(writable, readable)](#duplexwritable-readable)
- [filter(predicate, options)](#filterpredicate-options)
- [flatMap(mapper, options)](#flatMapmapper-options)
- [fromArray(array)](#fromArrayarray)
- [instance(defaultOptions)](#instancedefaultOptions)
- [join(separator)](#joinseparator)
- [last(readable)](#lastreadable)
- [map(mapper, options)](#mapmapper-options)
- [merge(streams)](#mergestreams)
- [parallelMap(mapper, parallel, sleepTime, options)](#parallelMapmapper-parallel-sleepTime-options)
- [parse()](#parse)
- [rate()](#rate())
- [reduce(iteratee, initialValue, options)](#reduceiteratee-initialValue,-options)
- [replace(searchValue, replaceValue)](#replacesearchValue-replaceValue)
- [split(separator)](#splitseparator)
- [stringify()](#stringify)

## batch(batchSize, maxBatchAge, options)
Returns a `Transform` stream which produces all incoming data in batches of size `batchSize`.

| Param | Type | Description |
| --- | --- | --- |
| `batchSize` | `number` | Size of the batches to be produced |
| `maxBatchAge` | `number`  | Maximum number of milliseconds a message will be queued for. E.g. a batch will be produced before reaching `batchSize` if the first message queued is `maxBatchAge` ms old or more |
| `options` | `TransformOptions` | Options passed down to the Transform object |

```js
strom.fromArray(["a", "b", "c", "d"])
    .pipe(strom.batch(3, 500))
    .pipe(process.stdout);
// ["a","b","c"]
// ["d"] //After 500ms
```

## child(childProcess)
Returns a `Duplex` stream from a child process' stdin and stdout

| Param | Type | Description |
| --- | --- | --- |
| childProcess | `ChildProcess` | Child process from which to create duplex stream |

```js
const catProcess = require("child_process").exec("grep -o ab");
strom.fromArray(["a", "b", "c"])
    .pipe(strom.child(catProcess))
    .pipe(process.stdout);
// ab is printed out
```

## collect(options)
Returns a `ReadWrite` stream that collects streamed chunks into an array or buffer

| Param | Type | Description |
| --- | --- | --- |
| `options` | `object`  |  |
| `options.objectMode` | `boolean` | Whether this stream should behave as a stream of objects |

```js
strom.fromArray(["a", "b", "c"])
    .pipe(strom.collect({ objectMode: true }))
    .once("data", object => console.log(object));
// [ 'a', 'b', 'c' ] is printed out
```

## compose(streams, errorCb, options)

Returns a `Transform` stream which consists of all `streams` but behaves as a single stream. The returned stream can be piped into and from transparently.

| Param | Type | Description |
| --- | --- | --- |
| `streams` | `Array` | Streams to be composed |
| `errorCb` | `(err: Error) => void`  | Function called when an error occurs in any of the streams |
| `options` | `TransformOptions` | Options passed down to the Transform object |

```js
const composed = strom.compose([
    strom.split(),
    strom.map(data => data.trim()),
    strom.filter(str => !!str),
    strom.parse(),
    strom.flatMap(data => data),
    strom.stringify(),
]);

const data = ["[1,2,3] \n  [4,5,6] ", "\n [7,8,9] \n\n"];

strom.fromArray(data).pipe(composed).pipe(process.stdout);
// 123456789
```

## concat(streams)
Returns a `Readable` stream of readable streams concatenated together

| Param | Type | Description |
| --- | --- | --- |
| `streams` | `...Readable[]` | Readable streams to concatenate |

```js
const source1 = new Readable();
const source2 = new Readable();
strom.concat(source1, source2).pipe(process.stdout)
source1.push("a1 ");
source2.push("c3 ");
source1.push("b2 ");
source2.push("d4 ");
source1.push(null);
source2.push(null);
// a1 b2 c3 d4 is printed out
```

## duplex(writable, readable)
Returns a `Duplex` stream from a writable stream that is assumed to somehow, when written to,
cause the given readable stream to yield chunks

| Param | Type | Description |
| --- | --- | --- |
| `writable` | `Writable` | Writable stream assumed to cause the readable stream to yield chunks when written to |
| `readable` | `Readable` | Readable stream assumed to yield chunks when the writable stream is written to |

```js
const catProcess = require("child_process").exec("grep -o ab");
strom.fromArray(["a", "b", "c"])
    .pipe(strom.duplex(catProcess.stdin, catProcess.stdout))
    .pipe(process.stdout);
// ab is printed out
```

## filter(predicate, options)
Returns a `ReadWrite` stream that filters out streamed chunks for which the predicate does not hold

| Param | Type | Description |
| --- | --- | --- |
| `predicate` | `(chunk: T, encoding: string) => boolean` | Predicate with which to filter scream chunks |
| `options` | `object`  |  |
| `options.objectMode` | `boolean` | `boolean` | Whether this stream should behave as a stream of objects |

```js
strom.fromArray(["a", "b", "c"])
    .pipe(strom.filter(s => s !== "b"))
    .pipe(process.stdout);
// ac is printed out
```

## flatMap(mapper, options)
Returns a `ReadWrite` stream that flat maps streamed chunks

| Param | Type | Description |
| --- | --- | --- |
| `mapper` | `(chunk: T, encoding: string) => R[]` | Mapper function, mapping each (chunk, encoding) to an array of new chunks (or a promise of such) |
| `options` | `object`  |  |
| `options.readableObjectMode` | `boolean` | Whether this stream should behave as a readable stream of objects |
| `options.writableObjectMode` | `boolean` | Whether this stream should behave as a writable stream of objects |

```js
strom.fromArray(["a", "AA"])
    .pipe(strom.flatMap(s => new Array(s.length).fill(s)))
    .pipe(process.stdout);
// aAAAA is printed out
```

## fromArray(array)
Convert an array into a `Readable` stream of its elements

| Param | Type | Description |
| --- | --- | --- |
| `array` | `T[]` | Array of elements to stream |

```js
strom.fromArray(["a", "b"])
    .pipe(process.stdout);
// ab is printed out
```

## instance(defaultOptions)
Creates a stromjs instance that uses the provided default options for any created stream function

| Param | Type | Description |
| --- | --- | --- |
| `defaultOptions` | `TransformOptions` | Default TransformOptions to apply to created stream functions |

```js
const strom = require("stromjs").instance({objectMode: false})
```

## join(separator)
Returns a `ReadWrite` stream that joins streamed chunks using the given separator

| Param | Type | Description |
| --- | --- | --- |
| `separator` | `string` | Separator to join with |
| `options` | `object` | |
| `options.encoding` | `string` | Character encoding to use for decoding chunks. Defaults to utf8

```js
strom.fromArray(["a", "b", "c"])
    .pipe(strom.join(","))
    .pipe(process.stdout);
// a,b,c is printed out
```

## last(readable)
Returns a `Promise` resolving to the last streamed chunk of the given readable stream, after it has
ended

| Param | Type | Description |
| --- | --- | --- |
| `readable` | `Readable` | Readable stream to wait on |

```js
let f = async () => {
    const source = strom.fromArray(["a", "b", "c"]);
    console.log(await strom.last(source));
};
f();
// c is printed out
```

## map(mapper, options)
Returns a `ReadWrite` stream that maps streamed chunks

| Param | Type | Description |
| --- | --- | --- |
| `mapper` | `(chunk: T, encoding: string) => R` | Mapper function, mapping each (chunk, encoding) to a new chunk (or a promise of such) |
| `options` | `object`  |  |
| `options.readableObjectMode` | `boolean` | Whether this stream should behave as a readable stream of objects |
| `options.writableObjectMode` | `boolean` | Whether this stream should behave as a writable stream of objects |

```js
strom.fromArray(["a", "b"])
    .pipe(strom.map(s => s.toUpperCase()))
    .pipe(process.stdout);
// AB is printed out
```

## merge(streams)
Returns a `Readable` stream of readable streams merged together in chunk arrival order

| Param | Type | Description |
| --- | --- | --- |
| `streams` | `...Readable[]` | Readable streams to merge |

```js
const source1 = new Readable({ read() {} });
const source2 = new Readable({ read() {} });
strom.merge(source1, source2).pipe(process.stdout);
source1.push("a1 ");
setTimeout(() => source2.push("c3 "), 10);
setTimeout(() => source1.push("b2 "), 20);
setTimeout(() => source2.push("d4 "), 30);
setTimeout(() => source1.push(null), 40);
setTimeout(() => source2.push(null), 50);
// a1 c3 b2 d4 is printed out
```

## parallelMap(mapper, parallel, sleepTime, options)
Returns a `Transform` stream which maps incoming data through the async mapper with the given parallelism.

| Param | Type | Description | Default |
| --- | --- | --- | --- |
| `mapper` | `async (chunk: T, encoding: string) => R` | Mapper function, mapping each (chunk, encoding) to a new chunk (non-async will not be parallelized) | -- |
| `parallel` | `number`  | Number of concurrent executions of the mapper allowed | 10 |
| `sleepTime` | `number` | Number of milliseconds to wait before testing if more messages can be processed | 1 |

```js
function sleep(time) {
    return time > 0 ? new Promise(resolve => setTimeout(resolve, time)) : null;
}

strom
    .fromArray([1, 2, 3, 4, 6, 8])
    .pipe(
        strom.parallelMap(async d => {
            await sleep(10000 - d * 1000);
            return `${d}`;
        }, 3),
    )
    .pipe(process.stdout);

// 321864
```

## parse()
Returns a `ReadWrite` stream that parses the streamed chunks as JSON

```js
strom.fromArray(['{ "a": "b" }'])
    .pipe(strom.parse())
    .once("data", object => console.log(object));
// { a: 'b' } is printed out
```

## reduce(iteratee, initialValue, options)
Returns a `ReadWrite` stream that reduces streamed chunks down to a single value and yield that
value

| Param | Type | Description |
| --- | --- | --- |
| `iteratee` | `(chunk: T, encoding: string) => R` | Reducer function to apply on each streamed chunk |
| `initialValue` | `T` | Initial value |
| `options` | `object`  |  |
| `options.readableObjectMode` | `boolean` | Whether this stream should behave as a readable stream of objects |
| `options.writableObjectMode` | `boolean` | Whether this stream should behave as a writable stream of objects |

```js
strom.fromArray(["a", "b", "cc"])
    .pipe(strom.reduce((acc, s) => ({ ...acc, [s]: s.length }), {}))
    .pipe(strom.stringify())
    .pipe(process.stdout);
// {"a":1,"b":1","c":2} is printed out
```

## replace(searchValue, replaceValue)
Returns a `ReadWrite` stream that replaces occurrences of the given string or regular expression  in
the streamed chunks with the specified replacement string

| Param | Type | Description |
| --- | --- | --- |
| `searchValue` |  `string \| RegExp` | Search string to use |
| `replaceValue` | `string` | Replacement string to use |
| `options` | `object` | |
| `options.encoding` | `string` | Character encoding to use for decoding chunks. Defaults to utf8

```js
strom.fromArray(["a1", "b22", "c333"])
    .pipe(strom.replace(/b\d+/, "B"))
    .pipe(process.stdout);
// a1Bc333 is printed out
```

## split(separator)
Returns a `ReadWrite` stream that splits streamed chunks using the given separator

| Param | Type | Description |
| --- | --- | --- |
| `separator` | `string` | Separator to split by, defaulting to `"\n"` |
| `options` | `object` | |
| `options.encoding` | `string` | Character encoding to use for decoding chunks. Defaults to utf8

```js
strom.fromArray(["a,b", "c,d"])
    .pipe(strom.split(","))
    .pipe(strom.join("|"))
    .pipe(process.stdout);
// a|bc|d is printed out
```

## stringify()
Returns a `ReadWrite` stream that stringifies the streamed chunks to JSON

```js
strom.fromArray([{ a: "b" }])
    .pipe(strom.stringify())
    .pipe(process.stdout);
// {"a":"b"} is printed out
```

## accumulator(flushStrategy, iteratee, options)
TO BE DOCUMENTED


## demux(pipelineConstructor, demuxBy, options)
TO BE DOCUMENTED


## rate()
TO BE DOCUMENTED

```js
const strom = require("stromjs").strom();

function sleep(time) {
    return time > 0 ? new Promise(resolve => setTimeout(resolve, time)) : null;
}

const rate = strom.rate(2, 1, { behavior: 1 });
rate.pipe(strom.map(x => console.log(x)));
async function produce() {
    rate.write(1);
    await sleep(500);
    rate.write(2);
    await sleep(500);
    rate.write(3);
    rate.write(4);
    rate.write(5);
    await sleep(500);
    rate.write(6);
}

produce();
```
