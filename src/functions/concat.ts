import { Readable } from "stream";
/**
 * Return a Readable stream of readable streams concatenated together
 * @param streams Readable streams to concatenate
 */
export function concat(...streams: NodeJS.ReadableStream[]): Readable {
    let isStarted = false;
    let currentStreamIndex = 0;
    const startCurrentStream = () => {
        if (currentStreamIndex >= streams.length) {
            wrapper.push(null);
        } else {
            streams[currentStreamIndex]
                .on("data", chunk => {
                    if (!wrapper.push(chunk)) {
                        streams[currentStreamIndex].pause();
                    }
                })
                .on("error", err => wrapper.emit("error", err))
                .on("end", () => {
                    currentStreamIndex++;
                    startCurrentStream();
                });
        }
    };

    const wrapper = new Readable({
        objectMode: true,
        read() {
            if (!isStarted) {
                isStarted = true;
                startCurrentStream();
            }
            if (currentStreamIndex < streams.length) {
                streams[currentStreamIndex].resume();
            }
        },
    });
    return wrapper;
}
