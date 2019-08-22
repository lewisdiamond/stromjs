import {
    pipeline,
    Transform,
    Writable,
    Pipe,
    WritableOptions,
    Readable,
    Duplex,
} from "stream";

/**
 * Return a Readable stream of readable streams concatenated together
 * @param streams Readable streams to concatenate
 */

// First Readable --> Readable
// First Transform | Duplex, Last Writable --> Writable
//
export function compose(
    streams: Array<Readable | Duplex | Transform | Writable>,
    options?: WritableOptions,
): Duplex {
    // Maybe just return a new stream here
    if (streams.length < 2) {
        throw new Error("Not enough");
    }

    const duplex = new Duplex({
        objectMode: true,
        write(chunk, enc, cb) {
            const first = streams[0] as Writable;
            if (!first.write(chunk)) {
                first.on("drain", cb);
            } else {
                cb();
            }
        },
        read(size) {
            let chunk;
            while (
                null !==
                (chunk = (streams[streams.length - 1] as Readable).read())
            ) {
                this.push(chunk);
            }
        },
    });

    pipeline(streams, (err: any) => {
        duplex.emit("error", err);
    });

    return duplex;
}
