import { Transform, TransformOptions } from "stream";

export function batch(
    batchSize: number = 1000,
    maxBatchAge: number = 500,
    options: TransformOptions = {},
): Transform {
    let buffer: any[] = [];
    let timer: NodeJS.Timer | null = null;
    const sendChunk = (self: Transform) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = null;
        self.push(buffer);
        buffer = [];
    };
    return new Transform({
        ...options,
        transform(chunk, encoding, callback) {
            buffer.push(chunk);
            if (buffer.length === batchSize) {
                sendChunk(this);
            } else {
                if (timer === null) {
                    timer = setInterval(() => {
                        sendChunk(this);
                    }, maxBatchAge);
                }
            }
            callback();
        },
        flush(callback) {
            sendChunk(this);
            callback();
        },
    });
}
