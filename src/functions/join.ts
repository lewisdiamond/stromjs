import { Transform } from "stream";
import { StringDecoder } from "string_decoder";
import { WithEncoding } from "./baseDefinitions";
/**
 * Return a ReadWrite stream that joins streamed chunks using the given separator
 * @param separator Separator to join with
 * @param options
 * @param options.encoding Encoding written chunks are assumed to use
 */
export function join(
    separator: string,
    options: WithEncoding = { encoding: "utf8" },
): Transform {
    let isFirstChunk = true;
    const decoder = new StringDecoder(options.encoding);
    return new Transform({
        readableObjectMode: true,
        async transform(chunk: Buffer, encoding, callback) {
            const asString = decoder.write(chunk);
            // Take care not to break up multi-byte characters spanning multiple chunks
            if (asString !== "" || chunk.length === 0) {
                if (!isFirstChunk) {
                    this.push(separator);
                }
                this.push(asString);
                isFirstChunk = false;
            }
            callback();
        },
    });
}
