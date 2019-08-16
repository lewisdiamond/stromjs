import { Readable } from "stream";
/**
 * Convert an array into a Readable stream of its elements
 * @param array Array of elements to stream
 */
export function fromArray(array: any[]): Readable {
    let cursor = 0;
    return new Readable({
        objectMode: true,
        read() {
            if (cursor < array.length) {
                this.push(array[cursor]);
                cursor++;
            } else {
                this.push(null);
            }
        },
    });
}
