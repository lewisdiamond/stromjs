import { Transform, TransformOptions } from "stream";
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
    options?: TransformOptions,
) {
    return new Transform({
        ...options,
        async transform(chunk: T, encoding?: any, callback?: any) {
            let isPromise = false;
            try {
                const result = predicate(chunk, encoding);
                isPromise = result instanceof Promise;
                if (!!(await result)) {
                    callback(null, chunk);
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
