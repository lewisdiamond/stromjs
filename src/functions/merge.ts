import { Readable } from "stream";

export function merge(...streams: Readable[]): Readable {
    let isStarted = false;
    let streamEndedCount = 0;
    return new Readable({
        objectMode: true,
        read() {
            if (streamEndedCount >= streams.length) {
                this.push(null);
            } else if (!isStarted) {
                isStarted = true;
                streams.forEach((stream) =>
                    stream
                        .on("data", (chunk) => {
                            if (!this.push(chunk)) {
                                streams.forEach((s) => s.pause());
                            }
                        })
                        .on("error", (err) => this.emit("error", err))
                        .on("end", () => {
                            streamEndedCount++;
                            if (streamEndedCount === streams.length) {
                                this.push(null);
                            }
                        }),
                );
            } else {
                streams.forEach((s) => s.resume());
            }
        },
    });
}
