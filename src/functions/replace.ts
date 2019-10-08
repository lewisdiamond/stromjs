import { Transform } from "stream";
import { StringDecoder } from "string_decoder";
import { WithEncoding } from "./baseDefinitions";

export function replace(
    searchValue: string | RegExp,
    replaceValue: string,
    options: WithEncoding = { encoding: "utf8" },
): Transform {
    const decoder = new StringDecoder(options.encoding);
    return new Transform({
        readableObjectMode: true,
        transform(chunk: Buffer, encoding, callback) {
            const asString = decoder.write(chunk);
            // Take care not to break up multi-byte characters spanning multiple chunks
            if (asString !== "" || chunk.length === 0) {
                callback(
                    undefined,
                    asString.replace(searchValue, replaceValue),
                );
            } else {
                callback();
            }
        },
    });
}
