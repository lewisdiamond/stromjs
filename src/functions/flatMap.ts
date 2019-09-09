import { Transform } from "stream";
import { TransformOptions } from "./baseDefinitions";

export function flatMap<T, R>(
    mapper:
        | ((chunk: T, encoding: string) => R[])
        | ((chunk: T, encoding: string) => Promise<R[]>),
    options: TransformOptions = {
        readableObjectMode: true,
        writableObjectMode: true,
    },
): Transform {
    return new Transform({
        ...options,
        async transform(chunk: T, encoding, callback) {
            let isPromise = false;
            try {
                const mapped = mapper(chunk, encoding);
                isPromise = mapped instanceof Promise;
                (await mapped).forEach(c => this.push(c));
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
    });
}
