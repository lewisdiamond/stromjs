import { Transform, TransformOptions } from "stream";
import { StringDecoder } from "string_decoder";
import { WithEncoding } from "./baseDefinitions";

export function split(
    separator: string | RegExp = "\n",
    options: WithEncoding & TransformOptions = {
        encoding: "utf8",
        objectMode: true,
    },
): Transform {
    let buffered = "";
    const decoder = new StringDecoder(options.encoding);

    return new Transform({
        readableObjectMode: true,
        transform(chunk: Buffer, encoding, callback) {
            const asString = decoder.write(chunk);
            const split = asString.split(separator);
            if (split.length > 1) {
                split[0] = buffered.concat(split[0]);
                buffered = "";
            }
            buffered += split[split.length - 1];
            split.slice(0, -1).forEach((part: string) => this.push(part));
            callback();
        },
        flush(callback) {
            callback(undefined, buffered + decoder.end());
        },
    });
}
