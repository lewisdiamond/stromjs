import { Transform, Writable, Pipe, WritableOptions } from "stream";

class Compose extends Writable implements Pipe {
    private head: Writable | Transform;
    private tail: Writable | Transform;
    constructor(
        streams: Array<Transform | Writable>,
        options?: WritableOptions,
    ) {
        super(options);
        if (streams.length < 2) {
            throw new Error("Cannot compose 1 or less streams");
        }
        this.head = streams[0];
        for (let i = 1; i < streams.length; i++) {
            streams[i - 1].pipe(streams[i]);
        }
        this.tail = streams[streams.length - 1];
    }

    public pipe<T extends NodeJS.WritableStream>(
        destination: T,
        options: { end?: boolean } | undefined,
    ) {
        return this.tail.pipe(
            destination,
            options,
        );
    }

    public _write(chunk: any, enc: string, cb: any) {
        this.head.write(chunk.toString ? chunk.toString() : chunk, cb);
    }
}

/**
 * Return a Readable stream of readable streams concatenated together
 * @param streams Readable streams to concatenate
 */
export function compose(
    streams: Array<Transform | Writable>,
    options?: WritableOptions,
): Compose {
    return new Compose(streams, options);
}
