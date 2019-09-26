import { Transform, TransformOptions } from "stream";

export function collect(options: TransformOptions = {}): Transform {
    const collected: any[] = [];
    return new Transform({
        ...options,
        transform(data, encoding, callback) {
            collected.push(data);
            callback();
        },
        flush(callback) {
            this.push(
                options.objectMode ? collected : Buffer.concat(collected),
            );
            callback();
        },
    });
}
