# Strom 

**Dependency-free stream utils for Node.js**

<sub>Released under the [MIT](https://git.lewis.id/strom/blob/master/LICENSE) license.</sub>

```sh
yarn add stromjs
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


## map(mapper, options)
Return a `ReadWrite` stream that maps streamed chunks

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


## flatMap(mapper, options)
Return a `ReadWrite` stream that flat maps streamed chunks

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


## filter(predicate, options)
Return a `ReadWrite` stream that filters out streamed chunks for which the predicate does not hold

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


## reduce(iteratee, initialValue, options)
Return a `ReadWrite` stream that reduces streamed chunks down to a single value and yield that
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


## split(separator)
Return a `ReadWrite` stream that splits streamed chunks using the given separator

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


## join(separator)
Return a `ReadWrite` stream that joins streamed chunks using the given separator

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


## replace(searchValue, replaceValue)
Return a `ReadWrite` stream that replaces occurrences of the given string or regular expression  in
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


## parse()
Return a `ReadWrite` stream that parses the streamed chunks as JSON

```js
strom.fromArray(['{ "a": "b" }'])
    .pipe(strom.parse())
    .once("data", object => console.log(object));
// { a: 'b' } is printed out
```


## stringify()
Return a `ReadWrite` stream that stringifies the streamed chunks to JSON

```js
strom.fromArray([{ a: "b" }])
    .pipe(strom.stringify())
    .pipe(process.stdout);
// {"a":"b"} is printed out
```


## collect(options)
Return a `ReadWrite` stream that collects streamed chunks into an array or buffer

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


## concat(streams)
Return a `Readable` stream of readable streams concatenated together

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


## merge(streams)
Return a `Readable` stream of readable streams merged together in chunk arrival order

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


## duplex(writable, readable)
Return a `Duplex` stream from a writable stream that is assumed to somehow, when written to,
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


## child(childProcess)
Return a `Duplex` stream from a child process' stdin and stdout

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


## last(readable)
Return a `Promise` resolving to the last streamed chunk of the given readable stream, after it has 
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
