import { Transform, TransformOptions } from "stream";

export function unbatch(
    options: TransformOptions = {
        objectMode: true,
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
