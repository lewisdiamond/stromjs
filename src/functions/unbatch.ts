import { Transform } from "stream";
import { TransformOptions } from "./baseDefinitions";
/**
 * Unbatches and sends individual chunks of data
 */
export function unbatch(
    options: TransformOptions = {
        readableObjectMode: true,
        writableObjectMode: true,
    },
) {
    return new Transform({
        ...options,
        transform(data, encoding, callback) {
            for (const d of data) {
                this.push(d);
            }
            callback();
        },
    });
}
