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
 * Return a ReadWrite stream that collects streamed objects or bytes into an array or buffer
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
