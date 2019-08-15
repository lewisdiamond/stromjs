import { Transform } from "stream";
import { ThroughOptions } from "../baseDefinitions";
/**
 * Return a ReadWrite stream that filters out streamed chunks for which the predicate does not hold
 * @param predicate Predicate with which to filter scream chunks
 * @param options
 * @param options.objectMode Whether this stream should behave as a stream of objects
 */
export function filter<T>(
    predicate:
        | ((chunk: T, encoding: string) => boolean)
        | ((chunk: T, encoding: string) => Promise<boolean>),
    options: ThroughOptions = {
        objectMode: true,
    },
) {
    return new Transform({
        readableObjectMode: options.objectMode,
        writableObjectMode: options.objectMode,
        async transform(chunk: T, encoding, callback) {
            let isPromise = false;
            try {
                const result = predicate(chunk, encoding);
                isPromise = result instanceof Promise;
                if (!!(await result)) {
                    callback(undefined, chunk);
                } else {
                    callback();
                }
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
    });
}
