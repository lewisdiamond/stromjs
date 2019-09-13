import { WritableOptions, Writable } from "stream";

enum EventSubscription {
    Last = 0,
    First,
    All,
    Self,
    Unhandled,
}

const eventsTarget = {
    close: EventSubscription.Self,
    data: EventSubscription.All,
    drain: EventSubscription.Self,
    end: EventSubscription.Self,
    error: EventSubscription.Self,
    finish: EventSubscription.Self,
    pause: EventSubscription.Self,
    pipe: EventSubscription.Unhandled,
    readable: EventSubscription.Self,
    resume: EventSubscription.Self,
    unpipe: EventSubscription.Unhandled,
};

export function demux(
    construct: () => NodeJS.WritableStream | NodeJS.ReadWriteStream,
    demuxBy: string | ((chunk: any) => string),
    options?: WritableOptions,
): Writable {
    return new Demux(construct, demuxBy, options);
}

class Demux extends Writable {
    private streamsByKey: {
        [key: string]: NodeJS.WritableStream | NodeJS.ReadWriteStream;
    };
    private demuxer: (chunk: any) => string;
    private construct: (
        destKey?: string,
    ) => NodeJS.WritableStream | NodeJS.ReadWriteStream;
    constructor(
        construct: (
            destKey?: string,
        ) => NodeJS.WritableStream | NodeJS.ReadWriteStream,
        demuxBy: string | ((chunk: any) => string),
        options: WritableOptions = {},
    ) {
        super(options);
        this.demuxer =
            typeof demuxBy === "string" ? chunk => chunk[demuxBy] : demuxBy;
        this.construct = construct;
        this.streamsByKey = {};
    }

    public _write(chunk: any, encoding: any, cb: any) {
        const destKey = this.demuxer(chunk);
        if (this.streamsByKey[destKey] === undefined) {
            this.streamsByKey[destKey] = this.construct(destKey);
        }
        if (!this.streamsByKey[destKey].write(chunk, encoding)) {
            this.streamsByKey[destKey].once("drain", () => {
                cb();
            });
        } else {
            cb();
        }
    }

    public on(event: string, cb: any) {
        switch (eventsTarget[event]) {
            case EventSubscription.Self:
                super.on(event, cb);
                break;
            case EventSubscription.All:
                Object.keys(this.streamsByKey).forEach(key =>
                    this.streamsByKey[key].on(event, cb),
                );
                break;
            case EventSubscription.Unhandled:
                throw new Error(
                    "Stream must be multiplexed before handling this event",
                );
            default:
                super.on(event, cb);
        }
        return this;
    }

    public once(event: string, cb: any) {
        switch (eventsTarget[event]) {
            case EventSubscription.Self:
                super.once(event, cb);
                break;
            case EventSubscription.All:
                Object.keys(this.streamsByKey).forEach(key =>
                    this.streamsByKey[key].once(event, cb),
                );
                break;
            case EventSubscription.Unhandled:
                throw new Error(
                    "Stream must be multiplexed before handling this event",
                );
            default:
                super.once(event, cb);
        }
        return this;
    }
}
