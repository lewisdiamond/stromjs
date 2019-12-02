import { Transform, TransformOptions } from "stream";
import { sleep } from "../helpers";

export function parallelMap<T, R>(
    mapper: (data: T) => R,
    parallel: number = 10,
    sleepTime: number = 1,
    options?: TransformOptions,
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
