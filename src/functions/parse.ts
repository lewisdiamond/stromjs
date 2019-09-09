import { Transform } from "stream";
import { StringDecoder } from "string_decoder";
import { SerializationFormats } from "./baseDefinitions";

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
