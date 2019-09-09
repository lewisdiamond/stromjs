import { pipeline, Duplex, DuplexOptions } from "stream";

export function compose(
    streams: Array<
        NodeJS.ReadableStream | NodeJS.ReadWriteStream | NodeJS.WritableStream
    >,
    options?: DuplexOptions,
): Compose {
    if (streams.length < 2) {
        throw new Error("At least two streams are required to compose");
    }

    return new Compose(streams, options);
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
    drain: EventSubscription.Self,
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
    public writable: boolean;
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
        (this.first as NodeJS.WritableStream).write(chunk, encoding, cb);
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

    public once(event: string, cb: any) {
        switch (eventsTarget[event]) {
            case EventSubscription.First:
                this.first.once(event, cb);
                break;
            case EventSubscription.Last:
                this.last.once(event, cb);
                break;
            case EventSubscription.All:
                this.streams.forEach(s => s.once(event, cb));
                break;
            default:
                super.once(event, cb);
        }
        return this;
    }
}
