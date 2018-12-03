import { Transform, Readable, Writable, Duplex } from "stream";
import { ChildProcess } from "child_process";

export interface ThroughOptions {
    objectMode?: boolean;
}
export interface TransformOptions {
    readableObjectMode?: boolean;
    writableObjectMode?: boolean;
}

/**
 * Convert an array into a Readable stream of its elements
 * @param array Array of elements to stream
 */
export function fromArray(array: any[]): NodeJS.ReadableStream {
    let cursor = 0;
    return new Readable({
        objectMode: true,
        read() {
            if (cursor < array.length) {
                this.push(array[cursor]);
                cursor++;
            } else {
                this.push(null);
            }
        },
    });
}

/**
 * Return a ReadWrite stream that maps streamed chunks
 * @param mapper Mapper function, mapping each (chunk, encoding) to a new chunk (or a promise of such)
 * @param options
 * @param options.readableObjectMode Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode Whether this stream should behave as a writable stream of objects
 */
export function map<T, R>(
    mapper: (chunk: T, encoding: string) => R,
    options: TransformOptions = {
        readableObjectMode: true,
        writableObjectMode: true,
    },
): NodeJS.ReadWriteStream {
    return new Transform({
        ...options,
        async transform(chunk: T, encoding, callback) {
            let isPromise = false;
            try {
                const mapped = mapper(chunk, encoding);
                isPromise = mapped instanceof Promise;
                callback(undefined, await mapped);
            } catch (err) {
                if (isPromise) {
                    // Calling the callback asynchronously with an error wouldn't emit the error, so emit directly
                    this.emit("error", err);
                    callback();
                } else {
                    callback(err);
                }
            }
        },
    });
}

/**
 * Return a ReadWrite stream that flat maps streamed chunks
 * @param mapper Mapper function, mapping each (chunk, encoding) to an array of new chunks (or a promise of such)
 * @param options
 * @param options.readableObjectMode Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode Whether this stream should behave as a writable stream of objects
 */
export function flatMap<T, R>(
    mapper:
        | ((chunk: T, encoding: string) => R[])
        | ((chunk: T, encoding: string) => Promise<R[]>),
    options: TransformOptions = {
        readableObjectMode: true,
        writableObjectMode: true,
    },
): NodeJS.ReadWriteStream {
    return new Transform({
        ...options,
        async transform(chunk: T, encoding, callback) {
            let isPromise = false;
            try {
                const mapped = mapper(chunk, encoding);
                isPromise = mapped instanceof Promise;
                (await mapped).forEach(c => this.push(c));
                callback();
            } catch (err) {
                if (isPromise) {
                    // Calling the callback asynchronously with an error wouldn't emit the error, so emit directly
                    this.emit("error", err);
                    callback();
                } else {
                    callback(err);
                }
            }
        },
    });
}

/**
 * Return a ReadWrite stream that filters out streamed chunks for which the predicate does not hold
 * @param predicate Predicate with which to filter scream chunks
 * @param options
 * @param options.objectMode Whether this stream should behave as a stream of objects
 */
export function filter<T>(
    predicate:
        | ((chunk: T, encoding: string) => boolean)
        | ((chunk: T, encoding: string) => Promise<boolean>),
    options: ThroughOptions = {
        objectMode: true,
    },
) {
    return new Transform({
        readableObjectMode: options.objectMode,
        writableObjectMode: options.objectMode,
        async transform(chunk: T, encoding, callback) {
            let isPromise = false;
            try {
                const result = predicate(chunk, encoding);
                isPromise = result instanceof Promise;
                if (!!(await result)) {
                    callback(undefined, chunk);
                } else {
                    callback();
                }
            } catch (err) {
                if (isPromise) {
                    // Calling the callback asynchronously with an error wouldn't emit the error, so emit directly
                    this.emit("error", err);
                    callback();
                } else {
                    callback(err);
                }
            }
        },
    });
}

/**
 * Return a ReadWrite stream that reduces streamed chunks down to a single value and yield that
 * value
 * @param iteratee Reducer function to apply on each streamed chunk
 * @param initialValue Initial value
 * @param options
 * @param options.readableObjectMode Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode Whether this stream should behave as a writable stream of objects
 */
export function reduce<T, R>(
    iteratee:
        | ((previousValue: R, chunk: T, encoding: string) => R)
        | ((previousValue: R, chunk: T, encoding: string) => Promise<R>),
    initialValue: R,
    options: TransformOptions = {
        readableObjectMode: true,
        writableObjectMode: true,
    },
) {
    let value = initialValue;
    return new Transform({
        readableObjectMode: options.readableObjectMode,
        writableObjectMode: options.writableObjectMode,
        async transform(chunk: T, encoding, callback) {
            let isPromise = false;
            try {
                const result = iteratee(value, chunk, encoding);
                isPromise = result instanceof Promise;
                value = await result;
                callback();
            } catch (err) {
                if (isPromise) {
                    // Calling the callback asynchronously with an error wouldn't emit the error, so emit directly
                    this.emit("error", err);
                    callback();
                } else {
                    callback(err);
                }
            }
        },
        flush(callback) {
            // Best effort attempt at yielding the final value (will throw if e.g. yielding an object and
            // downstream doesn't expect objects)
            try {
                callback(undefined, value);
            } catch (err) {
                try {
                    this.emit("error", err);
                } catch {
                    // Best effort was made
                }
            }
        },
    });
}

/**
 * Return a ReadWrite stream that splits streamed chunks using the given separator
 * @param separator Separator to split by, defaulting to "\n"
 */
export function split(
    separator: string | RegExp = "\n",
): NodeJS.ReadWriteStream {
    let buffered: string = "";
    return new Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        async transform(chunk: string, encoding, callback) {
            const splitted = chunk.split(separator);
            if (buffered.length > 0 && splitted.length > 1) {
                splitted[0] = buffered.concat(splitted[0]);
                buffered = "";
            }
            buffered += splitted[splitted.length - 1];
            splitted.slice(0, -1).forEach((part: string) => this.push(part));
            callback();
        },
        flush(callback) {
            callback(undefined, buffered);
        },
    });
}

/**
 * Return a ReadWrite stream that joins streamed chunks using the given separator
 * @param separator Separator to join with
 */
export function join(separator: string): NodeJS.ReadWriteStream {
    let isFirstChunk = true;
    return new Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        async transform(chunk: string, encoding, callback) {
            if (!isFirstChunk) {
                this.push(separator);
            }
            this.push(chunk);
            isFirstChunk = false;
            callback();
        },
    });
}

/**
 * Return a ReadWrite stream that replaces occurrences of the given string or regular expression  in
 * the streamed chunks with the specified replacement string
 * @param searchValue Search string to use
 * @param replaceValue Replacement string to use
 */
export function replace(
    searchValue: string | RegExp,
    replaceValue: string,
): NodeJS.ReadWriteStream {
    return new Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        transform(chunk: string, encoding, callback) {
            callback(undefined, chunk.replace(searchValue, replaceValue));
        },
    });
}

/**
 * Return a ReadWrite stream that parses the streamed chunks as JSON
 */
export function parse(): NodeJS.ReadWriteStream {
    return new Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        async transform(chunk: string, encoding, callback) {
            try {
                // Using await causes parsing errors to be emitted
                callback(undefined, await JSON.parse(chunk));
            } catch (err) {
                callback(err);
            }
        },
    });
}

type JsonPrimitive = string | number | object;
type JsonValue = JsonPrimitive | JsonPrimitive[];
interface JsonParseOptions {
    pretty: boolean;
}

/**
 * Return a ReadWrite stream that stringifies the streamed chunks to JSON
 */
export function stringify(
    options: JsonParseOptions = { pretty: false },
): NodeJS.ReadWriteStream {
    return new Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        transform(chunk: JsonValue, encoding, callback) {
            callback(
                undefined,
                options.pretty
                    ? JSON.stringify(chunk, null, 2)
                    : JSON.stringify(chunk),
            );
        },
    });
}

/**
 * Return a ReadWrite stream that collects streamed chunks into an array or buffer
 * @param options
 * @param options.objectMode Whether this stream should behave as a stream of objects
 */
export function collect(
    options: ThroughOptions = { objectMode: false },
): NodeJS.ReadWriteStream {
    const collected: any[] = [];
    return new Transform({
        readableObjectMode: options.objectMode,
        writableObjectMode: options.objectMode,
        transform(data, encoding, callback) {
            collected.push(data);
            callback();
        },
        flush(callback) {
            this.push(
                options.objectMode ? collected : Buffer.concat(collected),
            );
            callback();
        },
    });
}

/**
 * Return a Readable stream of readable streams concatenated together
 * @param streams Readable streams to concatenate
 */
export function concat(
    ...streams: NodeJS.ReadableStream[]
): NodeJS.ReadableStream {
    let isStarted = false;
    let currentStreamIndex = 0;
    const startCurrentStream = () => {
        if (currentStreamIndex >= streams.length) {
            wrapper.push(null);
        } else {
            streams[currentStreamIndex]
                .on("data", chunk => {
                    if (!wrapper.push(chunk)) {
                        streams[currentStreamIndex].pause();
                    }
                })
                .on("error", err => wrapper.emit("error", err))
                .on("end", () => {
                    currentStreamIndex++;
                    startCurrentStream();
                });
        }
    };

    const wrapper = new Readable({
        objectMode: true,
        read() {
            if (!isStarted) {
                isStarted = true;
                startCurrentStream();
            }
            if (currentStreamIndex < streams.length) {
                streams[currentStreamIndex].resume();
            }
        },
    });
    return wrapper;
}

/**
 * Return a Readable stream of readable streams merged together in chunk arrival order
 * @param streams Readable streams to merge
 */
export function merge(
    ...streams: NodeJS.ReadableStream[]
): NodeJS.ReadableStream {
    let isStarted = false;
    let streamEndedCount = 0;
    return new Readable({
        objectMode: true,
        read() {
            if (streamEndedCount >= streams.length) {
                this.push(null);
            } else if (!isStarted) {
                isStarted = true;
                streams.forEach(stream =>
                    stream
                        .on("data", chunk => {
                            if (!this.push(chunk)) {
                                streams.forEach(s => s.pause());
                            }
                        })
                        .on("error", err => this.emit("error", err))
                        .on("end", () => {
                            streamEndedCount++;
                            if (streamEndedCount === streams.length) {
                                this.push(null);
                            }
                        }),
                );
            } else {
                streams.forEach(s => s.resume());
            }
        },
    });
}

/**
 * Return a Duplex stream from a writable stream that is assumed to somehow, when written to,
 * cause the given readable stream to yield chunks
 * @param writable Writable stream assumed to cause the readable stream to yield chunks when written to
 * @param readable Readable stream assumed to yield chunks when the writable stream is written to
 */
export function duplex(writable: Writable, readable: Readable) {
    const wrapper = new Duplex({
        readableObjectMode: true,
        writableObjectMode: true,
        read() {
            readable.resume();
        },
        write(chunk, encoding, callback) {
            return writable.write(chunk, encoding, callback);
        },
        final(callback) {
            writable.end(callback);
        },
    });
    readable
        .on("data", chunk => {
            if (!wrapper.push(chunk)) {
                readable.pause();
            }
        })
        .on("error", err => wrapper.emit("error", err))
        .on("end", () => wrapper.push(null));
    writable.on("drain", () => wrapper.emit("drain"));
    writable.on("error", err => wrapper.emit("error", err));
    return wrapper;
}

/**
 * Return a Duplex stream from a child process' stdin and stdout
 * @param childProcess Child process from which to create duplex stream
 */
export function child(childProcess: ChildProcess) {
    return duplex(childProcess.stdin, childProcess.stdout);
}

/**
 * Return a Promise resolving to the last streamed chunk of the given readable stream, after it has
 * ended
 * @param readable Readable stream to wait on
 */
export function last<T>(readable: Readable): Promise<T | null> {
    let lastChunk: T | null = null;
    return new Promise((resolve, reject) => {
        readable
            .on("data", chunk => (lastChunk = chunk))
            .on("end", () => resolve(lastChunk));
    });
}
