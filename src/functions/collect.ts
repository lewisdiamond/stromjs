import { Transform } from "stream";
import { ThroughOptions } from "./baseDefinitions";

export function collect(
    options: ThroughOptions = { objectMode: false },
): Transform {
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
