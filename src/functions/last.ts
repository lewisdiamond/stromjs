/**
 * Return a Promise resolving to the last streamed chunk of the given readable stream, after it has
 * ended
 * @param readable Readable stream to wait on
 */
export function last<T>(readable: NodeJS.ReadableStream): Promise<T | null> {
    let lastChunk: T | null = null;
    return new Promise((resolve, _) => {
        readable
            .on("data", chunk => (lastChunk = chunk))
            .on("end", () => resolve(lastChunk));
    });
}
