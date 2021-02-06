import { Duplex } from "stream";

export function duplex(
    writable: NodeJS.WritableStream,
    readable: NodeJS.ReadableStream,
) {
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
        .on("data", (chunk) => {
            if (!wrapper.push(chunk)) {
                readable.pause();
            }
        })
        .on("error", (err) => wrapper.emit("error", err))
        .on("end", () => wrapper.push(null));
    writable.on("drain", () => wrapper.emit("drain"));
    writable.on("error", (err) => wrapper.emit("error", err));
    return wrapper;
}
