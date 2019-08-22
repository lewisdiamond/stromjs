import { Readable, Writable, WritableOptions, Transform, Duplex } from "stream";
import { ChildProcess } from "child_process";
import * as baseFunctions from "./baseFunctions";

import {
    ThroughOptions,
    TransformOptions,
    WithEncoding,
    JsonParseOptions,
    FlushStrategy,
    AccumulatorByIteratee,
} from "./baseDefinitions";

/**
 * Convert an array into a Readable stream of its elements
 * @param array Array of elements to stream
 */
export function fromArray(array: any[]): Readable {
    return baseFunctions.fromArray(array);
}

/**
 * Return a ReadWrite stream that maps streamed chunks
 * @param mapper Mapper function, mapping each (chunk, encoding) to a new chunk (or a promise of such)
 * @param options?
 * @param options.readableObjectMode? Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode? Whether this stream should behave as a writable stream of objects
 */
export function map<T, R>(
    mapper: (chunk: T, encoding?: string) => R,
    options?: TransformOptions,
): Transform {
    return baseFunctions.map(mapper, options);
}

/**
 * Return a ReadWrite stream that flat maps streamed chunks
 * @param mapper Mapper function, mapping each (chunk, encoding) to an array of new chunks (or a promise of such)
 * @param options?
 * @param options.readableObjectMode? Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode? Whether this stream should behave as a writable stream of objects
 */
export function flatMap<T, R>(
    mapper:
        | ((chunk: T, encoding: string) => R[])
        | ((chunk: T, encoding: string) => Promise<R[]>),
    options?: TransformOptions,
): Transform {
    return baseFunctions.flatMap(mapper, options);
}

/**
 * Return a ReadWrite stream that filters out streamed chunks for which the predicate does not hold
 * @param predicate Predicate with which to filter scream chunks
 * @param options?
 * @param options.objectMode? Whether this stream should behave as a stream of objects.
 */
export function filter<T>(
    mapper:
        | ((chunk: T, encoding: string) => boolean)
        | ((chunk: T, encoding: string) => Promise<boolean>),
    options?: ThroughOptions,
): Transform {
    return baseFunctions.filter(mapper, options);
}

/**
 * Return a ReadWrite stream that reduces streamed chunks down to a single value and yield that
 * value
 * @param iteratee Reducer function to apply on each streamed chunk
 * @param initialValue Initial value
 * @param options?
 * @param options.readableObjectMode? Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode? Whether this stream should behave as a writable stream of objects
 */
export function reduce<T, R>(
    iteratee:
        | ((previousValue: R, chunk: T, encoding: string) => R)
        | ((previousValue: R, chunk: T, encoding: string) => Promise<R>),
    initialValue: R,
    options?: TransformOptions,
): Transform {
    return baseFunctions.reduce(iteratee, initialValue, options);
}

/**
 * Return a ReadWrite stream that splits streamed chunks using the given separator
 * @param separator? Separator to split by, defaulting to "\n"
 * @param options? Defaults to encoding: utf8
 * @param options.encoding? Encoding written chunks are assumed to use
 */
export function split(
    separator?: string | RegExp,
    options?: WithEncoding,
): Transform {
    return baseFunctions.split(separator, options);
}

/**
 * Return a ReadWrite stream that joins streamed chunks using the given separator
 * @param separator Separator to join with
 * @param options? Defaults to encoding: utf8
 * @param options.encoding? Encoding written chunks are assumed to use
 */
export function join(separator: string, options?: WithEncoding): Transform {
    return baseFunctions.join(separator, options);
}

/**
 * Return a ReadWrite stream that replaces occurrences of the given string or regular expression  in
 * the streamed chunks with the specified replacement string
 * @param searchValue Search string to use
 * @param replaceValue Replacement string to use
 * @param options? Defaults to encoding: utf8
 * @param options.encoding Encoding written chunks are assumed to use
 */
export function replace(
    searchValue: string | RegExp,
    replaceValue: string,
    options?: WithEncoding,
): Transform {
    return baseFunctions.replace(searchValue, replaceValue, options);
}

/**
 * Return a ReadWrite stream that parses the streamed chunks as JSON. Each streamed chunk
 * must be a fully defined JSON string in utf8.
 */
export function parse(): Transform {
    return baseFunctions.parse();
}

/**
 * Return a ReadWrite stream that stringifies the streamed chunks to JSON
 * @param options?
 * @param options.pretty If true, whitespace is inserted into the stringified chunks.
 *
 */
export function stringify(options?: JsonParseOptions): Transform {
    return baseFunctions.stringify(options);
}

/**
 * Return a ReadWrite stream that collects streamed chunks into an array or buffer
 * @param options?
 * @param options.objectMode? Whether this stream should behave as a stream of objects
 */
export function collect(options?: ThroughOptions): Transform {
    return baseFunctions.collect(options);
}

/**
 * Return a Readable stream of readable streams concatenated together
 * @param streams Readable streams to concatenate
 */
export function concat(...streams: Readable[]): Readable {
    return baseFunctions.concat(...streams);
}

/**
 * Return a Readable stream of readable streams concatenated together
 * @param streams Readable streams to merge
 */
export function merge(...streams: Readable[]): Readable {
    return baseFunctions.merge(...streams);
}

/**
 * Return a Duplex stream from a writable stream that is assumed to somehow, when written to,
 * cause the given readable stream to yield chunks
 * @param writable Writable stream assumed to cause the readable stream to yield chunks when written to
 * @param readable Readable stream assumed to yield chunks when the writable stream is written to
 */
export function duplex(writable: Writable, readable: Readable): Duplex {
    return baseFunctions.duplex(writable, readable);
}

/**
 * Return a Duplex stream from a child process' stdin and stdout
 * @param childProcess Child process from which to create duplex stream
 */
export function child(childProcess: ChildProcess): Duplex {
    return baseFunctions.child(childProcess);
}

/**
 * Return a Promise resolving to the last streamed chunk of the given readable stream, after it has
 * ended
 * @param readable Readable stream to wait on
 */
export function last<T>(readable: Readable): Promise<T | null> {
    return baseFunctions.last(readable);
}

/**
 * Stores chunks of data internally in array and batches when batchSize is reached.
 * @param batchSize Size of the batches, defaults to 1000.
 * @param maxBatchAge? Max lifetime of a batch, defaults to 500
 */
export function batch(batchSize: number, maxBatchAge?: number): Transform {
    return baseFunctions.batch(batchSize, maxBatchAge);
}

/**
 * Unbatches and sends individual chunks of data.
 */
export function unbatch(): Transform {
    return baseFunctions.unbatch();
}

/**
 * Limits rate of data transferred into stream.
 * @param options?
 * @param targetRate? Desired rate in ms.
 * @param period? Period to sleep for when rate is above or equal to targetRate.
 */
export function rate(targetRate?: number, period?: number): Transform {
    return baseFunctions.rate(targetRate, period);
}

/**
 * Limits number of parallel processes in flight.
 * @param parallel Max number of parallel processes.
 * @param func Function to execute on each data chunk.
 * @param pause Amount of time to pause processing when max number of parallel processes are executing.
 */
export function parallelMap<T, R>(
    mapper: (chunk: T) => R,
    parallel?: number,
    sleepTime?: number,
) {
    return baseFunctions.parallelMap(mapper, parallel, sleepTime);
}

/**
 * Accummulates and sends batches of data. Each chunk that flows into the stream is checked against items
 * in the buffer. How the buffer is mutated is based on 1 of 2 possible buffering strategies:
 * 	1. Sliding
 * 		- If the buffer is larger than the batchSize, the front of the buffer is popped to maintain
 * 		the batchSize. When no key is provided, the batchSize is effectively the buffer length. When
 * 		a key is provided, the batchSize is based on the value at that key. For example, given a key
 * 		of `timestamp` and a batchSize of 3000, each item in the buffer will be guaranteed to be
 * 		within 3000 timestamp units from the first element. This means that with a key, multiple elements
 * 		may be spliced off the front of the buffer. The buffer is then pushed into the stream.
 * 	2. Rolling
 * 		- If the buffer is larger than the batchSize, the buffer is cleared and pushed into the stream.
 * 		When no key is provided, the batchSize is the buffer length. When a key is provided, the batchSize
 * 		is based on the value at that key. For example, given a key of `timestamp` and a batchSize of 3000,
 * 		each item in the buffer will be guaranteed to be within 3000 timestamp units from the first element.
 * @param batchSize Size of the batch (in units of buffer length or value at key).
 * @param batchRate Desired rate of data transfer to next stream.
 * @param flushStrategy Buffering strategy to use.
 * @param keyBy Key to determine if element fits into buffer or items need to be cleared from buffer.
 */
export function accumulator(
    batchSize: number,
    batchRate: number | undefined,
    flushStrategy: FlushStrategy,
    keyBy?: string,
) {
    return baseFunctions.accumulator(
        batchSize,
        batchRate,
        flushStrategy,
        keyBy,
    );
}

/**
 * Accummulates and sends batches of data. Each chunk that flows into the stream is checked against items
 * in the buffer. How the buffer is mutated is based on 1 of 2 possible buffering strategies:
 * 	1. Sliding
 * 		- If the iteratee returns false, the front of the buffer is popped until iteratee returns true. The
 * 		item is pushed into the buffer and buffer is pushed into stream.
 * 	2. Rolling
 * 		- If the iteratee returns false, the buffer is cleared and pushed into stream. The item is
 * 		then pushed into the buffer.
 * @param batchRate Desired rate of data transfer to next stream.
 * @param flushStrategy Buffering strategy to use.
 * @param iteratee Function applied to buffer when a chunk of data enters stream to determine if element fits into
 * or items need to be cleared from buffer.
 */
export function accumulatorBy<T, S extends FlushStrategy>(
    batchRate: number | undefined,
    flushStrategy: S,
    iteratee: AccumulatorByIteratee<T>,
) {
    return baseFunctions.accumulatorBy(batchRate, flushStrategy, iteratee);
}

export function compose(
    streams: Array<Writable | Transform>,
    options?: WritableOptions,
) {
    return baseFunctions.compose(
        streams,
        options,
    );
}
