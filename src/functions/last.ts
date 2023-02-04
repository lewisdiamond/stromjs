export function last<T>(readable: NodeJS.ReadableStream): Promise<T | null> {
    let lastChunk: T | null = null;
    return new Promise((resolve, reject) => {
        readable
            .on("data", (chunk) => (lastChunk = chunk))
            .on("error", (e) => reject(e))
            .on("end", () => resolve(lastChunk));
    });
}
