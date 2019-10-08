import { Transform, TransformOptions } from "stream";

export function filter<T>(
    predicate:
        | ((chunk: T, encoding: string) => boolean)
        | ((chunk: T, encoding: string) => Promise<boolean>),
    options?: TransformOptions,
) {
    return new Transform({
        ...options,
        async transform(chunk: T, encoding?: any, callback?: any) {
            const result = await predicate(chunk, encoding);
            if (result === true) {
                callback(null, chunk);
            } else {
                callback();
            }
        },
    });
}
