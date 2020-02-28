export async function sleep(time: number): Promise<{} | null> {
    return time > 0 ? new Promise(resolve => setTimeout(resolve, time)) : null;
}

export type AllStreams =
    | NodeJS.ReadableStream
    | NodeJS.ReadWriteStream
    | NodeJS.WritableStream;

export function isReadable(
    stream: AllStreams,
): stream is NodeJS.WritableStream {
    return (
        (stream as NodeJS.ReadableStream).pipe !== undefined &&
        (stream as any).readable === true
    );
}
