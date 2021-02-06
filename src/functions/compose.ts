import { isReadable, isWritable } from "../helpers";
import { PassThrough, pipeline, TransformOptions, Transform, Stream, Readable, Writable } from "stream";

export function compose(
    streams: (Readable | Writable)[],
    errorCallback?: (err: any) => void,
    options?: TransformOptions,
): Compose {
    if (streams.length < 2) {
        throw new Error("At least two streams are required to compose");
    }

    return new Compose(streams, errorCallback, options);
}


export class Compose extends Transform {
    private first: Writable & Readable;
    private last: Readable;
    private streams: Stream[];

    constructor(
        streams: (Readable | Writable)[],
        errorCallback?: (err: any) => void,
        options?: TransformOptions,
    ) {
        super(options);
        this.first = new PassThrough(options);
        const last = streams.pop();
        if (last && isReadable(last)) {
            this.last = last;
        } else {
            throw new TypeError("Invalid last stream provided, it must be readable");
        }
        this.streams = streams;
        pipeline(
            [this.first,
            ...streams,
            this.last],
            errorCallback ||
                ((error: any) => {
                    if (error) {
                        this.emit("error", error);
                    }
                }),
        );

        if (isReadable(this.last)) {
            this.last.pipe(
                new Transform({
                    ...options,
                    transform: (d: any, _encoding, cb) => {
                        this.push(d);
                        cb();
                    },
                }),
            );
        }
    }

    public _transform(chunk: any, encoding: BufferEncoding, cb: any) {
        this.first.write(chunk, encoding, cb);
    }

    public _flush(cb: any) {
        if (isWritable(this.first)) {
            this.first.push(null);
        }
        this.last.once("end", () => {
            cb();
        });
    }

    public _destroy(error: any, cb: (error?: any) => void) {
        this.streams.forEach(s => (s as any).destroy());
        cb(error);
    }

    public bubble(...events: string[]) {
        this.streams.forEach(s => {
            events.forEach(e => {
                s.on(e, (...args) => super.emit(e, ...args));
            });
        });
    }
}
