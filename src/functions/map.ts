import { Transform, TransformOptions } from "stream";

export function map<T, R>(
    mapper: (chunk: T, encoding: string) => R,
    options: TransformOptions = { objectMode: true },
): Transform {
    return new Transform({
        ...options,
        async transform(chunk: T, encoding, callback) {
            try {
                callback(null, await mapper(chunk, encoding));
            } catch (e) {
                callback(e);
            }
        },
    });
}
