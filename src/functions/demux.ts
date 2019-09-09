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

/**
 * Return a Duplex stream that is pushed data from multiple sources
 * @param streams Source streams to multiplex
 * @param options Duplex stream options
 */
export function demux(
    construct: () => NodeJS.WritableStream | NodeJS.ReadWriteStream,
    demuxBy: { key?: string; keyBy?: (chunk: any) => string },
    options?: WritableOptions,
): Writable {
    return new Demux(construct, demuxBy, options);
}

class Demux extends Writable {
    public isWritable: boolean;
    private streamsByKey: {
        [key: string]: {
            stream: NodeJS.WritableStream | NodeJS.ReadWriteStream;
            writable: boolean;
        };
    };
    private demuxer: (chunk: any) => string;
    private nonWritableStreams: Array<string>;
    private construct: (
        destKey?: string,
    ) => NodeJS.WritableStream | NodeJS.ReadWriteStream;
    constructor(
        construct: (
            destKey?: string,
        ) => NodeJS.WritableStream | NodeJS.ReadWriteStream,
        demuxBy: { key?: string; keyBy?: (chunk: any) => string },
        options?: WritableOptions,
    ) {
        super(options);
        if (demuxBy.keyBy === undefined && demuxBy.key === undefined) {
            throw new Error(
                "keyBy or key must be provided in second parameter",
            );
        }
        this.demuxer = demuxBy.keyBy || ((chunk: any) => chunk[demuxBy.key!]);
        this.construct = construct;
        this.streamsByKey = {};
        this.isWritable = true;
        this.nonWritableStreams = [];
    }

    public _write(chunk: any, encoding?: any, cb?: any) {
        const destKey = this.demuxer(chunk);
        if (this.streamsByKey[destKey] === undefined) {
            this.streamsByKey[destKey] = {
                stream: this.construct(destKey),
                writable: true,
            };
        }
        // Throttle when one stream is not writable anymore
        // Set writable to false
        // keep state of all the streams, if one is not writable demux shouldnt be writable
        // Small optimization is to keep writing until you get a following event to the unwritable destination
        let res = false;
        if (this.streamsByKey[destKey].writable && this.isWritable) {
            res = this.streamsByKey[destKey].stream.write(chunk, encoding, cb);
        }
        if (!res && this.isWritable) {
            this.isWritable = false;
            this.streamsByKey[destKey].writable = false;
            this.nonWritableStreams.push(destKey);
            this.streamsByKey[destKey].stream.once("drain", () => {
                this.nonWritableStreams.filter(key => key !== destKey);
                this.isWritable = this.nonWritableStreams.length === 0;
                this.streamsByKey[destKey].stream.write(chunk, encoding, cb);
                if (this.isWritable) {
                    this.emit("drain");
                }
            });
        }
    }

    public on(event: string, cb: any) {
        switch (eventsTarget[event]) {
            case EventSubscription.Self:
                super.on(event, cb);
                break;
            case EventSubscription.All:
                Object.keys(this.streamsByKey).forEach(key =>
                    this.streamsByKey[key].stream.on(event, cb),
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
                    this.streamsByKey[key].stream.once(event, cb),
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
