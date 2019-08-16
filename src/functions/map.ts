import { Transform } from "stream";
import { TransformOptions } from "./baseDefinitions";
/**
 * Return a ReadWrite stream that maps streamed chunks
 * @param mapper Mapper function, mapping each (chunk, encoding) to a new chunk (or a promise of such)
 * @param options
 * @param options.readableObjectMode Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode Whether this stream should behave as a writable stream of objects
 */
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
            try {
                const mapped = await mapper(chunk, encoding);
                this.push(mapped);
                callback();
            } catch (err) {
                callback(err);
            }
        },
    });
}
