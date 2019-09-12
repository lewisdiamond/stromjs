import { Transform } from "stream";
import { sleep } from "../helpers";
import { TransformOptions } from "./baseDefinitions";

export function parallelMap<T, R>(
    mapper: (data: T) => R,
    parallel: number = 10,
    sleepTime: number = 5,
    options: TransformOptions = {
        readableObjectMode: true,
        writableObjectMode: true,
    },
) {
    let inflight = 0;
    return new Transform({
        ...options,
        async transform(data, encoding, callback) {
            while (parallel <= inflight) {
                await sleep(sleepTime);
            }
            inflight += 1;
            callback();
            const res = await mapper(data);
            this.push(res);
            inflight -= 1;
        },
        async flush(callback) {
            while (inflight > 0) {
                await sleep(sleepTime);
            }
            callback();
        },
    });
}
