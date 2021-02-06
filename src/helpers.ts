import { Readable, Stream, Writable } from "stream";

export async function sleep(time: number): Promise<{} | null> {
    return time > 0 ? new Promise(resolve => setTimeout(resolve, time)) : null;
}

export function isReadable(
    stream: Stream,
): stream is Readable {
    return (
        (stream as Readable).pipe !== undefined &&
        (stream as Readable).readable === true
    );
}

export function isWritable(
    stream: Stream,
): stream is Writable {
    return (
        (stream as Writable).write !== undefined &&
        (stream as Writable).writable === true
    );
}
