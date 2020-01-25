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
    pipe: EventSubscription.Self,
    readable: EventSubscription.Self,
    resume: EventSubscription.Self,
    unpipe: EventSubscription.Self,
};

type DemuxStreams = NodeJS.WritableStream | NodeJS.ReadWriteStream;

export function demux(
    construct: (destKey?: string) => DemuxStreams,
    demuxBy: string | ((chunk: any) => string),
    options?: WritableOptions,
): Writable {
    return new Demux(construct, demuxBy, options);
}

// @TODO handle pipe event ie) Multiplex
class Demux extends Writable {
    private streamsByKey: {
        [key: string]: DemuxStreams;
    };
    private destination: Writable;
    private demuxer: (chunk: any) => string;
    private construct: (destKey?: string) => DemuxStreams;
    constructor(
        construct: (destKey?: string) => DemuxStreams,
        demuxBy: string | ((chunk: any) => string),
        options: WritableOptions = {},
    ) {
        super(options);
        this.demuxer =
            typeof demuxBy === "string" ? chunk => chunk[demuxBy] : demuxBy;
        this.construct = construct;
        this.streamsByKey = {};
    }

    public async _write(chunk: any, encoding: any, cb: any) {
        const destKey = this.demuxer(chunk);
        if (this.streamsByKey[destKey] === undefined) {
            this.streamsByKey[destKey] = await this.construct(destKey);
            if (this.destination !== undefined) {
                (this.streamsByKey[destKey] as any).pipe(this.destination);
            }
        }
        const writeRes = this.streamsByKey[destKey].write(chunk, encoding);
        if (!writeRes) {
            this.streamsByKey[destKey].once("drain", () => {
                cb();
            });
        } else {
            cb();
        }
    }

    public pipe(dest: any) {
        this.destination = dest;
        return dest;
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
            default:
                super.once(event, cb);
        }
        return this;
    }
}
