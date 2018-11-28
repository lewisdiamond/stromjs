import { Transform, Readable } from "stream";

/**
 * Convert an array into a readable stream of its elements
 * @param array The array of elements to stream
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
 * @param mapper The mapper function, mapping each (chunk, encoding) to a new chunk (or a promise of such)
 * @param options
 * @param options.readableObjectMode Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode Whether this stream should behave as a writable stream of objects
 */
export function map<T, R>(
    mapper: (chunk: T, encoding: string) => R,
    { readableObjectMode = true, writableObjectMode = true } = {},
): NodeJS.ReadWriteStream {
    return new Transform({
        readableObjectMode,
        writableObjectMode,
        async transform(chunk, encoding, callback) {
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
 * @param mapper The mapper function, mapping each (chunk, encoding) to an array of new chunks (or a promise of such)
 * @param options
 * @param options.readableObjectMode Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode Whether this stream should behave as a writable stream of objects
 */
export function flatMap<T, R>(
    mapper:
        | ((chunk: T, encoding: string) => R[])
        | ((chunk: T, encoding: string) => Promise<R[]>),
    { readableObjectMode = true, writableObjectMode = true } = {},
): NodeJS.ReadWriteStream {
    return new Transform({
        readableObjectMode,
        writableObjectMode,
        async transform(chunk, encoding, callback) {
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
 * Return a ReadWrite stream that splits streamed chunks using the given separator
 * @param separator The separator to split by, defaulting to "\n"
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
 * @param separator The separator to join with
 */
export function join(separator: string): NodeJS.ReadWriteStream {
    let isFirstChunk = true;
    return new Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        async transform(chunk, encoding, callback) {
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
 * Return a ReadWrite stream that collects streamed chunks into an array or buffer
 * @param options
 * @param options.objectMode Whether this stream should behave as a stream of objects
 */
export function collect({ objectMode = false } = {}): NodeJS.ReadWriteStream {
    const collected: any[] = [];
    return new Transform({
        readableObjectMode: objectMode,
        writableObjectMode: objectMode,
        transform(data, encoding, callback) {
            collected.push(data);
            callback();
        },
        flush(callback) {
            this.push(objectMode ? collected : Buffer.concat(collected));
            callback();
        },
    });
}

/**
 * Return a stream of readable streams concatenated together
 * @param streams The readable streams to concatenate
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
