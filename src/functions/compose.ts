import {
    pipeline,
    Transform,
    Writable,
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
        throw new Error("At least two streams are required to compose");
    }

    const first = streams[0] as Writable;
    const last = streams[streams.length - 1] as Readable;
    const duplex = new Duplex({
        ...options,
        write(chunk, enc, cb) {
            if (!first.write(chunk)) {
                first.once("drain", cb);
            } else {
                cb();
            }
        },
        read(size) {
            if (last.readable) {
                this.push(last.read(size));
            }
        },
    });

    pipeline(streams, (err: any) => {
        duplex.emit("error", err);
    });

    return duplex;
}
