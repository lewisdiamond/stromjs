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
            const splitData = asString.split(separator);
            if (splitData.length > 1) {
                splitData[0] = buffered.concat(splitData[0]);
                buffered = "";
            }
            buffered += splitData[splitData.length - 1];
            splitData.slice(0, -1).forEach((part: string) => this.push(part));
            callback();
        },
        flush(callback) {
            callback(undefined, buffered + decoder.end());
        },
    });
}
