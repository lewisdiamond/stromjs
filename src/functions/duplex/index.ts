import { Duplex, Writable, Readable } from "stream";
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
