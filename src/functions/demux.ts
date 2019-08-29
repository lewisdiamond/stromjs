import { WritableOptions, Writable } from "stream";

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
    private keyMap: {
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
        this.keyMap = {};
    }

    public _write(chunk: any, encoding: string, cb: any) {
        const destKey = this.demuxer(chunk);
        if (this.keyMap[destKey] === undefined) {
            this.keyMap[destKey] = this.construct(destKey).on("error", e => {
                this.emit("error", e);
            });
        }
        return this.keyMap[destKey].write(chunk, encoding, cb);
    }
}
