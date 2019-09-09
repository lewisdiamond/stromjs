import { Transform } from "stream";
import { TransformOptions } from "./baseDefinitions";

export function reduce<T, R>(
    iteratee:
        | ((previousValue: R, chunk: T, encoding: string) => R)
        | ((previousValue: R, chunk: T, encoding: string) => Promise<R>),
    initialValue: R,
    options: TransformOptions = {
        readableObjectMode: true,
        writableObjectMode: true,
    },
) {
    let value = initialValue;
    return new Transform({
        readableObjectMode: options.readableObjectMode,
        writableObjectMode: options.writableObjectMode,
        async transform(chunk: T, encoding, callback) {
            let isPromise = false;
            try {
                const result = iteratee(value, chunk, encoding);
                isPromise = result instanceof Promise;
                value = await result;
                callback();
            } catch (err) {
                if (isPromise) {
                    // Calling the callback asynchronously with an error wouldn't emit the error, so emit directly
                    this.emit("error", err);
                    callback();
                } else {
                    callback(err);
                }
            }
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
