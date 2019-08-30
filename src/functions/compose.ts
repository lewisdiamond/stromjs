import {
    pipeline,
    Duplex,
    Transform,
    Readable,
    Writable,
    DuplexOptions,
} from "stream";

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
): Compose {
    // Maybe just return a new stream here
    if (streams.length < 2) {
        throw new Error("At least two streams are required to compose");
    }

    const composed = new Compose(streams, options);

    return composed;
}

enum EventSubscription {
    Last = 0,
    First,
    All,
    Self,
}
const eventsTarget = {
    close: EventSubscription.Last,
    data: EventSubscription.Last,
    drain: EventSubscription.First,
    end: EventSubscription.Last,
    error: EventSubscription.Self,
    finish: EventSubscription.Last,
    pause: EventSubscription.Last,
    pipe: EventSubscription.First,
    readable: EventSubscription.Last,
    resume: EventSubscription.Last,
    unpipe: EventSubscription.First,
};

type AllStreams =
    | NodeJS.ReadableStream
    | NodeJS.ReadWriteStream
    | NodeJS.WritableStream;

export class Compose extends Duplex {
    private first: AllStreams;
    private last: AllStreams;
    private streams: AllStreams[];

    constructor(streams: AllStreams[], options?: DuplexOptions) {
        super(options);
        this.first = streams[0];
        this.last = streams[streams.length - 1];
        this.streams = streams;
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

    public bubble(...events: string[]) {
        this.streams.forEach(s => {
            events.forEach(e => {
                s.on(e, (...args) => super.emit(e, ...args));
            });
        });
    }

    public on(event: string, cb: any) {
        switch (eventsTarget[event]) {
            case EventSubscription.First:
                this.first.on(event, cb);
                break;
            case EventSubscription.Last:
                this.last.on(event, cb);
                break;
            case EventSubscription.All:
                this.streams.forEach(s => s.on(event, cb));
                break;
            default:
                super.on(event, cb);
        }
        return this;
    }
}
