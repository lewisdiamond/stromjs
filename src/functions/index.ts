import { Readable, Writable, Transform } from "stream";
import { ChildProcess } from "child_process";
import * as baseFunctions from "./baseFunctions";

import {
    ThroughOptions,
    TransformOptions,
    WithEncoding,
    JsonParseOptions,
    FlushStrategy,
    AccumulatorByIteratee,
} from "./definitions";

/**
 * Convert an array into a Readable stream of its elements
 * @param array Array of elements to stream
 */
export function fromArray(array: any[]): NodeJS.ReadableStream {
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
): NodeJS.ReadWriteStream {
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
): NodeJS.ReadWriteStream {
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
): NodeJS.ReadWriteStream {
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
): NodeJS.ReadWriteStream {
    return baseFunctions.split(separator, options);
}

/**
 * Return a ReadWrite stream that joins streamed chunks using the given separator
 * @param separator Separator to join with
 * @param options? Defaults to encoding: utf8
 * @param options.encoding? Encoding written chunks are assumed to use
 */
export function join(
    separator: string,
    options?: WithEncoding,
): NodeJS.ReadWriteStream {
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
): NodeJS.ReadWriteStream {
    return baseFunctions.replace(searchValue, replaceValue, options);
}

/**
 * Return a ReadWrite stream that parses the streamed chunks as JSON. Each streamed chunk
 * must be a fully defined JSON string in utf8.
 */
export function parse(): NodeJS.ReadWriteStream {
    return baseFunctions.parse();
}

/**
 * Return a ReadWrite stream that stringifies the streamed chunks to JSON
 * @param options?
 * @param options.pretty If true, whitespace is inserted into the stringified chunks.
 *
 */
export function stringify(options?: JsonParseOptions): NodeJS.ReadWriteStream {
    return baseFunctions.stringify(options);
}

/**
 * Return a ReadWrite stream that collects streamed chunks into an array or buffer
 * @param options?
 * @param options.objectMode? Whether this stream should behave as a stream of objects
 */
export function collect(options?: ThroughOptions): NodeJS.ReadWriteStream {
    return baseFunctions.collect(options);
}

/**
 * Return a Readable stream of readable streams concatenated together
 * @param streams Readable streams to concatenate
 */
export function concat(
    ...streams: NodeJS.ReadableStream[]
): NodeJS.ReadableStream {
    return baseFunctions.concat(...streams);
}

/**
 * Return a Readable stream of readable streams concatenated together
 * @param streams Readable streams to merge
 */
export function merge(
    ...streams: NodeJS.ReadableStream[]
): NodeJS.ReadableStream {
    return baseFunctions.merge(...streams);
}

/**
 * Return a Duplex stream from a writable stream that is assumed to somehow, when written to,
 * cause the given readable stream to yield chunks
 * @param writable Writable stream assumed to cause the readable stream to yield chunks when written to
 * @param readable Readable stream assumed to yield chunks when the writable stream is written to
 */
export function duplex(
    writable: Writable,
    readable: Readable,
): NodeJS.ReadWriteStream {
    return baseFunctions.duplex(writable, readable);
}

/**
 * Return a Duplex stream from a child process' stdin and stdout
 * @param childProcess Child process from which to create duplex stream
 */
export function child(childProcess: ChildProcess): NodeJS.ReadWriteStream {
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
 * Unbatches and sends individual chunks of data
 */
export function unbatch(): NodeJS.ReadWriteStream {
    return baseFunctions.unbatch();
}

/**
 * Limits date of data transferred into stream.
 * @param options?
 * @param targetRate? Desired rate in ms
 * @param period? Period to sleep for when rate is above or equal to targetRate
 */
export function rate(
    targetRate?: number,
    period?: number,
): NodeJS.ReadWriteStream {
    return baseFunctions.rate(targetRate, period);
}

/**
 * Limits number of parallel processes in flight.
 * @param parallel Max number of parallel processes.
 * @param func Function to execute on each data chunk
 * @param pause Amount of time to pause processing when max number of parallel processes are executing.
 */
export function parallelMap<T, R>(
    mapper: (chunk: T) => R,
    parallel?: number,
    sleepTime?: number,
) {
    return baseFunctions.parallelMap(mapper, parallel, sleepTime);
}

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

export function accumulatorBy<T, S extends FlushStrategy>(
    batchRate: number | undefined,
    flushStrategy: S,
    iteratee: AccumulatorByIteratee<T>,
) {
    return baseFunctions.accumulatorBy(batchRate, flushStrategy, iteratee);
}
