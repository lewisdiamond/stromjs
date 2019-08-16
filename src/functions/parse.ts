import { Transform } from "stream";
import { StringDecoder } from "string_decoder";
import { SerializationFormats } from "./baseDefinitions";
/**
 * Return a ReadWrite stream that parses the streamed chunks as JSON. Each streamed chunk
 * must be a fully defined JSON string.
 * @param format Format of serialized data, only utf8 supported.
 */
export function parse(
    format: SerializationFormats = SerializationFormats.utf8,
): Transform {
    const decoder = new StringDecoder(format);
    return new Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        async transform(chunk: Buffer, encoding, callback) {
            try {
                const asString = decoder.write(chunk);
                // Using await causes parsing errors to be emitted
                callback(undefined, await JSON.parse(asString));
            } catch (err) {
                callback(err);
            }
        },
    });
}
