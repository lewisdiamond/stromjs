import { Transform } from "stream";
import { TransformOptions } from "./baseDefinitions";

export function map<T, R>(
    mapper: (chunk: T, encoding: string) => R,
    options: TransformOptions = {
        readableObjectMode: true,
        writableObjectMode: true,
    },
): Transform {
    // remove try catch
    return new Transform({
        ...options,
        async transform(chunk: T, encoding, callback) {
            try {
                const mapped = await mapper(chunk, encoding);
                callback(null, mapped);
            } catch (err) {
                console.log("caught error", err.message);
                callback(err);
            }
        },
    });
}
