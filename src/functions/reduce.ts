import { Transform, TransformOptions } from "stream";

export function reduce<T, R>(
    iteratee:
        | ((previousValue: R, chunk: T, encoding: string) => R)
        | ((previousValue: R, chunk: T, encoding: string) => Promise<R>),
    initialValue: R,
    options: TransformOptions = {
        objectMode: true,
    },
) {
    let value = initialValue;
    return new Transform({
        ...options,
        async transform(chunk: T, encoding, callback) {
            value = await iteratee(value, chunk, encoding);
            callback();
        },
        flush(callback) {
            // Best effort attempt at yielding the final value (will throw if e.g. yielding an object and
            // downstream doesn't expect objects)
            try {
                callback(undefined, value);
            } catch (err) {
                try {
                    this.emit("error", err);
                } catch {
                    // Best effort was made
                }
            }
        },
    });
}
