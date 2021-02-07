import { Transform, TransformOptions } from "stream";

export function tap<T, R>(
    fn: (chunk: T, encoding: string) => R,
    options: TransformOptions = { objectMode: true },
): Transform {
    return new Transform({
        ...options,
        async transform(chunk: T, encoding, callback) {
            fn(chunk, encoding);
            callback(null, chunk);
        },
    });
}
