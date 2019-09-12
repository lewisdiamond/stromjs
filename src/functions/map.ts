import { Transform } from "stream";
import { TransformOptions } from "./baseDefinitions";

export function map<T, R>(
    mapper: (chunk: T, encoding: string) => R,
    options: TransformOptions = {
        readableObjectMode: true,
        writableObjectMode: true,
    },
): Transform {
    return new Transform({
        ...options,
        async transform(chunk: T, encoding, callback) {
            callback(null, await mapper(chunk, encoding));
        },
    });
}
