import { Transform } from "stream";
import { TransformOptions } from "../baseDefinitions";
/**
 * Return a ReadWrite stream that flat maps streamed chunks
 * @param mapper Mapper function, mapping each (chunk, encoding) to an array of new chunks (or a promise of such)
 * @param options
 * @param options.readableObjectMode Whether this stream should behave as a readable stream of objects
 * @param options.writableObjectMode Whether this stream should behave as a writable stream of objects
 */
export function flatMap<T, R>(
    mapper:
        | ((chunk: T, encoding: string) => R[])
        | ((chunk: T, encoding: string) => Promise<R[]>),
    options: TransformOptions = {
        readableObjectMode: true,
        writableObjectMode: true,
    },
): NodeJS.ReadWriteStream {
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
