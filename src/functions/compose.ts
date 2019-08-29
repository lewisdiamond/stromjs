import { pipeline, Duplex, DuplexOptions } from "stream";

/**
 * Return a Readable stream of readable streams concatenated together
 * @param streams Readable streams to concatenate
 */
// First Readable --> Readable
// First Transform | Duplex, Last Writable --> Writable
//
export function compose(
    streams: Array<
        NodeJS.ReadableStream | NodeJS.ReadWriteStream | NodeJS.WritableStream
    >,
    options?: DuplexOptions,
): Duplex {
    // Maybe just return a new stream here
    if (streams.length < 2) {
        throw new Error("At least two streams are required to compose");
    }

    const composed = new Compose(streams, options);

    return composed;
}

class Compose extends Duplex {
    private first:
        | NodeJS.ReadableStream
        | NodeJS.ReadWriteStream
        | NodeJS.WritableStream;
    private last:
        | NodeJS.ReadableStream
        | NodeJS.ReadWriteStream
        | NodeJS.WritableStream;
    constructor(
        streams: Array<
            | NodeJS.ReadableStream
            | NodeJS.ReadWriteStream
            | NodeJS.WritableStream
        >,
        options?: DuplexOptions,
    ) {
        super(options);
        this.first = streams[0];
        this.last = streams[streams.length - 1];
        pipeline(streams, (err: any) => {
            this.emit("error", err);
        });
    }

    public pipe<T extends NodeJS.WritableStream>(dest: T) {
        return (this.last as NodeJS.ReadableStream).pipe(dest);
    }

    public _write(chunk: any, encoding: string, cb: any) {
        const res = (this.first as NodeJS.WritableStream).write(chunk);
        cb();
        return res;
    }

    public on(event: string, cb: any) {
        if (event === "error") {
            super.on(event, cb);
        }
        this.last.on(event, cb);
        return this;
    }
}
