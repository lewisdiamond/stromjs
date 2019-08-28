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
    private keyMap: object;
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
            throw new Error("Need one");
        }
        this.demuxer = demuxBy.keyBy || ((chunk: any) => chunk[demuxBy.key!]);
        this.construct = construct;
        this.keyMap = {};
    }

    public write(chunk: any, encoding?: any, cb?: any): boolean {
        const destKey = this.demuxer(chunk);
        if (this.keyMap[destKey] === undefined) {
            this.keyMap[destKey] = this.construct(destKey);
        }
        const writeRes = this.keyMap[destKey].write(chunk);
        if (cb !== undefined) {
            cb();
        }
        return writeRes;
    }
}
