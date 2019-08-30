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
    private streamsByKey: {
        [key: string]: {
            stream: NodeJS.WritableStream | NodeJS.ReadWriteStream;
            writable: boolean;
        };
    };
    private demuxer: (chunk: any) => string;
    private isWritable: boolean;
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
    }

    public _write(chunk: any, encoding: string, cb: any) {
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
        if (this.isWritable && this.streamsByKey[destKey].writable) {
            res = this.streamsByKey[destKey].stream.write(chunk, encoding, cb);
        } else if (this.isWritable) {
            this.isWritable = false;
            // Buffer chunk?
            return this.isWritable;
        }

        /* If write above returns false and the stream written to was writable previously, we need to make demux
         * non-writable and update state to know the stream is nonWritable.
         * If write returns true and the stream was previously not writable, we need to update which streams
         * are non writable and determine if it is safe for demux to become writable (all streams are writable)
         */
        if (!res) {
            this.streamsByKey[destKey].writable = false;
            this.nonWritableStreams.push(destKey);
            this.isWritable = false;
            this.streamsByKey[destKey].stream.once("drain", () => {
                this.streamsByKey[destKey].writable = true;
                this.nonWritableStreams = this.nonWritableStreams.filter(
                    key => key !== destKey,
                );

                this.isWritable = this.nonWritableStreams.length === 0;
            });
        }

        return this.writable;
    }
}
