import { Transform, TransformOptions } from "stream";

export function flatMap<T, R>(
    mapper:
        | ((chunk: T, encoding: string) => R[])
        | ((chunk: T, encoding: string) => Promise<R[]>),
    options?: TransformOptions,
): Transform {
    return new Transform({
        ...options,
        async transform(chunk: T, encoding, callback) {
            try {
                (await mapper(chunk, encoding)).forEach((c) => this.push(c));
                callback();
            } catch (err) {
                callback(err);
            }
        },
    });
}
