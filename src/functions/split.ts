import { Transform } from "stream";
import { StringDecoder } from "string_decoder";
import { WithEncoding } from "./baseDefinitions";

interface SplitParams {
    separator?: string | RegExp;
    options?: WithEncoding;
}
export function split(
    separator: string | RegExp = "\n",
    options: WithEncoding = { encoding: "utf8" },
): Transform {
    let buffered = "";
    const decoder = new StringDecoder(options.encoding);

    return new Transform({
        readableObjectMode: true,
        transform(chunk: Buffer, encoding, callback) {
            const asString = decoder.write(chunk);
            const splitted = asString.split(separator);
            if (splitted.length > 1) {
                splitted[0] = buffered.concat(splitted[0]);
                buffered = "";
            }
            buffered += splitted[splitted.length - 1];
            splitted.slice(0, -1).forEach((part: string) => this.push(part));
            callback();
        },
        flush(callback) {
            callback(undefined, buffered + decoder.end());
        },
    });
}
