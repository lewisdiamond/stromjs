import { Transform } from "stream";
import * as baseFunctions from "./baseFunctions";

/**
 * Convert an array into a Readable stream of its elements
 * @param array Array of elements to stream
 */
export const fromArray = baseFunctions.fromArray;

/**
 * Return a ReadWrite stream that maps streamed chunks
 * @param mapper Mapper function, mapping each (chunk, encoding) to a new chunk (or a promise of such)
 * @param options?
 * @param options.readableObjectMode? Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode? Whether this stream should behave as a writable stream of objects
 */
export const map = baseFunctions.map;

/**
 * Return a ReadWrite stream that flat maps streamed chunks
 * @param mapper Mapper function, mapping each (chunk, encoding) to an array of new chunks (or a promise of such)
 * @param options?
 * @param options.readableObjectMode? Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode? Whether this stream should behave as a writable stream of objects
 */
export const flatMap = baseFunctions.flatMap;

/**
 * Return a ReadWrite stream that filters out streamed chunks for which the predicate does not hold
 * @param predicate Predicate with which to filter scream chunks
 * @param options?
 * @param options.objectMode? Whether this stream should behave as a stream of objects.
 */
export const filter = baseFunctions.filter;

/**
 * Return a ReadWrite stream that reduces streamed chunks down to a single value and yield that
 * value
 * @param iteratee Reducer function to apply on each streamed chunk
 * @param initialValue Initial value
 * @param options?
 * @param options.readableObjectMode? Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode? Whether this stream should behave as a writable stream of objects
 */
export const reduce = baseFunctions.reduce;

/**
 * Return a ReadWrite stream that splits streamed chunks using the given separator
 * @param separator? Separator to split by, defaulting to "\n"
 * @param options? Defaults to encoding: utf8
 * @param options.encoding? Encoding written chunks are assumed to use
 */
export const split = baseFunctions.split;

/**
 * Return a ReadWrite stream that joins streamed chunks using the given separator
 * @param separator Separator to join with
 * @param options? Defaults to encoding: utf8
 * @param options.encoding? Encoding written chunks are assumed to use
 */
export const join = baseFunctions.join;

/**
 * Return a ReadWrite stream that replaces occurrences of the given string or regular expression  in
 * the streamed chunks with the specified replacement string
 * @param searchValue Search string to use
 * @param replaceValue Replacement string to use
 * @param options? Defaults to encoding: utf8
 * @param options.encoding Encoding written chunks are assumed to use
 */
export const replace = baseFunctions.replace;

/**
 * Return a ReadWrite stream that parses the streamed chunks as JSON. Each streamed chunk
 * must be a fully defined JSON string in utf8.
 */
export const parse = baseFunctions.parse;

/**
 * Return a ReadWrite stream that stringifies the streamed chunks to JSON
 * @param options?
 * @param options.pretty If true, whitespace is inserted into the stringified chunks.
 *
 */
export const stringify = baseFunctions.stringify;

/**
 * Return a ReadWrite stream that collects streamed chunks into an array or buffer
 * @param options?
 * @param options.objectMode? Whether this stream should behave as a stream of objects
 */
export const collect = baseFunctions.collect;

/**
 * Return a Readable stream of readable streams concatenated together
 * @param streams Readable streams to concatenate
 */
export const concat = baseFunctions.concat;

/**
 * Return a Readable stream of readable streams concatenated together
 * @param streams Readable streams to merge
 */
export const merge = baseFunctions.merge;

/**
 * Return a Duplex stream from a writable stream that is assumed to somehow, when written to,
 * cause the given readable stream to yield chunks
 * @param writable Writable stream assumed to cause the readable stream to yield chunks when written to
 * @param readable Readable stream assumed to yield chunks when the writable stream is written to
 */
export const duplex = baseFunctions.duplex;

/**
 * Return a Duplex stream from a child process' stdin and stdout
 * @param childProcess Child process from which to create duplex stream
 */
export const child = baseFunctions.child;

/**
 * Return a Promise resolving to the last streamed chunk of the given readable stream, after it has
 * ended
 * @param readable Readable stream to wait on
 */
export const last = baseFunctions.last;

/**
 * Stores chunks of data internally in array and batches when batchSize is reached.
 * @param batchSize Size of the batches, defaults to 1000.
 * @param maxBatchAge? Max lifetime of a batch, defaults to 500
 */
export function batch(batchSize?: number, maxBatchAge?: number): Transform {
    return baseFunctions.batch(batchSize, maxBatchAge);
}

/**
 * Unbatches and sends individual chunks of data.
 */
export const unbatch = baseFunctions.unbatch;

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
export const parallelMap = baseFunctions.parallelMap;

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
 * @param flushStrategy Buffering strategy to use.
 * @param batchSize Size of the batch (in units of buffer length or value at key).
 * @param batchRate Desired rate of data transfer to next stream.
 * @param keyBy Key to determine if element fits into buffer or items need to be cleared from buffer.
 * @param options Transform stream options
 */
export const accumulator = baseFunctions.accumulator;

/**
 * Accummulates and sends batches of data. Each chunk that flows into the stream is checked against items
 * in the buffer. How the buffer is mutated is based on 1 of 2 possible buffering strategies:
 * 	1. Sliding
 * 		- If the iteratee returns false, the front of the buffer is popped until iteratee returns true. The
 * 		item is pushed into the buffer and buffer is pushed into stream.
 * 	2. Rolling
 * 		- If the iteratee returns false, the buffer is cleared and pushed into stream. The item is
 * 		then pushed into the buffer.
 * @param flushStrategy Buffering strategy to use.
 * @param iteratee Function applied to buffer when a chunk of data enters stream to determine if element fits into
 * or items need to be cleared from buffer.
 * @param batchRate Desired rate of data transfer to next stream.
 * @param options Transform stream options
 */
export const accumulatorBy = baseFunctions.accumulatorBy;

/**
 * Composes multiple streams together. Writing occurs on first stream, piping occurs from last stream.
 * @param streams Array of streams to compose. Minimum of two.
 * @param options Transform stream options
 */
export const compose = baseFunctions.compose;

/**
 * Composes multiple streams together. Writing occurs on first stream, piping occurs from last stream.
 * @param construct Constructor for new output source. Should return a Writable or ReadWrite stream.
 * @param demuxBy
 * @param demuxBy.key? Key to fetch value from source chunks to demultiplex source.
 * @param demuxBy.keyBy? Function to fetch value from source chunks to demultiplex source.
 * @param options Writable stream options
 */
export const demux = baseFunctions.demux;
