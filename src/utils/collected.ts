import { Transform } from "stream";

export function collected(stream: Transform): any {
    return new Promise((resolve, reject) => {
        stream.once("data", d => {
            resolve(d);
        });
        stream.once("error", e => {
            reject(e);
        });
    });
}
