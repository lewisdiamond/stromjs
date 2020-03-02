import { DuplexOptions, Duplex, Transform, Writable } from "stream";

import { isReadable } from "../helpers";

enum EventSubscription {
    Last = 0,
    First,
    All,
    Self,
    Unhandled,
}

type DemuxStreams = NodeJS.WritableStream | NodeJS.ReadWriteStream;

export interface DemuxOptions extends DuplexOptions {
    remultiplex?: boolean;
}

export function demux(
    construct: (destKey?: string) => DemuxStreams,
    demuxBy: string | ((chunk: any) => string),
    options?: DemuxOptions,
): Duplex {
    return new Demux(construct, demuxBy, options);
}

class Demux extends Duplex {
    private streamsByKey: {
        [key: string]: DemuxStreams;
    };
    private demuxer: (chunk: any) => string;
    private construct: (destKey?: string) => DemuxStreams;
    private remultiplex: boolean;
    private transform: Transform;
    constructor(
        construct: (destKey?: string) => DemuxStreams,
        demuxBy: string | ((chunk: any) => string),
        options: DemuxOptions = {},
    ) {
        super(options);
        this.demuxer =
            typeof demuxBy === "string" ? chunk => chunk[demuxBy] : demuxBy;
        this.construct = construct;
        this.remultiplex =
            options.remultiplex === undefined ? true : options.remultiplex;
        this.streamsByKey = {};
        this.transform = new Transform({
            ...options,
            transform: (d, _, cb) => {
                this.push(d);
                cb(null);
            },
        });

        this.on("unpipe", () => this._flush());
    }

    // tslint:disable-next-line
    public _read(size: number) {}

    public async _write(chunk: any, encoding: any, cb: any) {
        const destKey = this.demuxer(chunk);
        if (this.streamsByKey[destKey] === undefined) {
            const newPipeline = await this.construct(destKey);
            this.streamsByKey[destKey] = newPipeline;
            if (this.remultiplex && isReadable(newPipeline)) {
                (newPipeline as NodeJS.ReadWriteStream).pipe(this.transform);
            } else if (this.remultiplex) {
                console.error(
                    `Pipeline construct for ${destKey} does not implement readable interface`,
                );
            }
        }

        if (!this.streamsByKey[destKey].write(chunk, encoding)) {
            this.streamsByKey[destKey].once("drain", () => {
                cb();
            });
        } else {
            cb();
        }
    }

    public _flush() {
        const pipelines = Object.values(this.streamsByKey);
        let totalEnded = 0;
        pipelines.forEach(pipeline => {
            pipeline.once("end", () => {
                totalEnded++;
                if (pipelines.length === totalEnded) {
                    this.push(null);
                    this.emit("end");
                }
            });
        });
        pipelines.forEach(pipeline => pipeline.end());
    }

    public _destroy(error: any, cb: (error?: any) => void) {
        const pipelines = Object.values(this.streamsByKey);
        pipelines.forEach(p => (p as any).destroy());
        cb(error);
    }
}
