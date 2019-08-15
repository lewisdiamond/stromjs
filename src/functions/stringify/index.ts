import { Transform } from "stream";
import { JsonValue, JsonParseOptions } from "../definitions";

/**
 * Return a ReadWrite stream that stringifies the streamed chunks to JSON
 */
export function stringify(
    options: JsonParseOptions = { pretty: false },
): NodeJS.ReadWriteStream {
    return new Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        transform(chunk: JsonValue, encoding, callback) {
            callback(
                undefined,
                options.pretty
                    ? JSON.stringify(chunk, null, 2)
                    : JSON.stringify(chunk),
            );
        },
    });
}
