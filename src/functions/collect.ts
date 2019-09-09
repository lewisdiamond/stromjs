import { Transform } from "stream";
import { ThroughOptions } from "./baseDefinitions";
/**
 * Return a ReadWrite stream that collects streamed chunks into an array or buffer
 * @param options
 * @param options.objectMode Whether this stream should behave as a stream of objects
 */
export function collect(
    options: ThroughOptions = { objectMode: false },
): Transform {
    const collected: any[] = [];
    return new Transform({
        ...options,
        transform(data, encoding, callback) {
            collected.push(data);
            callback();
        },
        flush(callback) {
            this.push(
                options.objectMode ? collected : Buffer.concat(collected),
            );
            callback();
        },
    });
}
