# Mhysa

**Stream utils for Node.js**

```sh
yarn add mhysa
```

## fromArray(array)
Convert an array into a `Readable` stream of its elements

| Param | Type | Description |
| --- | --- | --- |
| `array` | `T[]` | Array of elements to stream |


## map(mapper, options)
Return a `ReadWrite` stream that maps streamed chunks

| Param | Type | Description |
| --- | --- | --- |
| `mapper` | `(chunk: T, encoding: string) => R` | Mapper function, mapping each (chunk, encoding) to a new chunk (or a promise of such) |
| `options` | `object`  |  |
| `options.readableObjectMode` | `boolean` | Whether this stream should behave as a readable stream of objects |
| `options.writableObjectMode` | `boolean` | Whether this stream should behave as a writable stream of objects |


## flatMap(mapper, options)
Return a `ReadWrite` stream that flat maps streamed chunks

| Param | Type | Description |
| --- | --- | --- |
| `mapper` | `(chunk: T, encoding: string) => R[]` | Mapper function, mapping each (chunk, encoding) to an array of new chunks (or a promise of such) |
| `options` | `object`  |  |
| `options.readableObjectMode` | `boolean` | Whether this stream should behave as a readable stream of objects |
| `options.writableObjectMode` | `boolean` | Whether this stream should behave as a writable stream of objects |


## filter(predicate, options)
Return a `ReadWrite` stream that filters out streamed chunks for which the predicate does not hold

| Param | Type | Description |
| --- | --- | --- |
| `predicate` | `(chunk: T, encoding: string) => boolean` | Predicate with which to filter scream chunks |
| `options` | `object`  |  |
| `options.objectMode` | `boolean` | `boolean` | Whether this stream should behave as a stream of objects |


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


## split(separator)
Return a `ReadWrite` stream that splits streamed chunks using the given separator

| Param | Type | Description |
| --- | --- | --- |
| `separator` | `string` | Separator to split by, defaulting to `"\n"` |


## join(separator)
Return a `ReadWrite` stream that joins streamed chunks using the given separator

| Param | Type | Description |
| --- | --- | --- |
| `separator` | `string` | Separator to join with |


## replace(searchValue, replaceValue)
Return a `ReadWrite` stream that replaces occurrences of the given string or regular expression  in
the streamed chunks with the specified replacement string

| Param | Type | Description |
| --- | --- | --- |
| `searchValue` |  `string | RegExp` | Search string to use |
| `replaceValue` | `string` | Replacement string to use |


## parse()
Return a `ReadWrite` stream that parses the streamed chunks as JSON

## stringify()
Return a `ReadWrite` stream that stringifies the streamed chunks to JSON

## collect(options)
Return a `ReadWrite` stream that collects streamed chunks into an array or buffer

| Param | Type | Description |
| --- | --- | --- |
| `options` | `object`  |  |
| `options.objectMode` | `boolean` | Whether this stream should behave as a stream of objects |


## concat(streams)
Return a `Readable` stream of readable streams concatenated together

| Param | Type | Description |
| --- | --- | --- |
| `streams` | `...Readable[]` | Readable streams to concatenate |


## merge(streams)
Return a `Readable` stream of readable streams merged together in chunk arrival order

| Param | Type | Description |
| --- | --- | --- |
| `streams` | `...Readable[]` | Readable streams to merge |


## duplex(writable, readable)
Return a `Duplex` stream from a writable stream that is assumed to somehow, when written to,
cause the given readable stream to yield chunks

| Param | Type | Description |
| --- | --- | --- |
| `writable` | `Writable` | Writable stream assumed to cause the readable stream to yield chunks when written to |
| `readable` | `Readable` | Readable stream assumed to yield chunks when the writable stream is written to |


## child(childProcess)
Return a `Duplex` stream from a child process' stdin and stdout

| Param | Type | Description |
| --- | --- | --- |
| childProcess | `ChildProcess` | Child process from which to create duplex stream |


## last(readable)
Return a `Promise` resolving to the last streamed chunk of the given readable stream, after it has 
ended

| Param | Type | Description |
| --- | --- | --- |
| `readable` | `Readable` | Readable stream to wait on |
