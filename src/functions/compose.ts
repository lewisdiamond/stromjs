import { AllStreams, isReadable } from "../helpers";
import { PassThrough, pipeline, TransformOptions, Transform } from "stream";

export function compose(
    streams: Array<
        NodeJS.ReadableStream | NodeJS.ReadWriteStream | NodeJS.WritableStream
    >,
    errorCallback?: (err: any) => void,
    options?: TransformOptions,
): Compose {
    if (streams.length < 2) {
        throw new Error("At least two streams are required to compose");
    }

    return new Compose(streams, errorCallback, options);
}

enum EventSubscription {
    Last = 0,
    First,
    All,
    Self,
}

export class Compose extends Transform {
    private first: AllStreams;
    private last: AllStreams;
    private streams: AllStreams[];
    private inputStream: ReadableStream;

    constructor(
        streams: AllStreams[],
        errorCallback?: (err: any) => void,
        options?: TransformOptions,
    ) {
        super(options);
        this.first = new PassThrough(options);
        this.last = streams[streams.length - 1];
        this.streams = streams;
        pipeline(
            [this.first, ...streams],
            errorCallback ||
                ((error: any) => {
                    if (error) {
                        this.emit("error", error);
                    }
                }),
        );

        if (isReadable(this.last)) {
            (this.last as NodeJS.ReadWriteStream).pipe(
                new Transform({
                    ...options,
                    transform: (d: any, encoding, cb) => {
                        this.push(d);
                        cb();
                    },
                }),
            );
        }
    }

    public _transform(chunk: any, encoding: string, cb: any) {
        (this.first as NodeJS.WritableStream).write(chunk, encoding, cb);
    }

    public _flush(cb: any) {
        if (isReadable(this.first)) {
            (this.first as any).push(null);
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
