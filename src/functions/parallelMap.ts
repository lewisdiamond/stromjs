import { Transform } from "stream";
import { sleep } from "../helpers";
import { TransformOptions } from "./baseDefinitions";
/**
 * Limits number of parallel processes in flight.
 * @param parallel Max number of parallel processes.
 * @param func Function to execute on each data chunk
 * @param pause Amount of time to pause processing when max number of parallel processes are executing.
 */
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
            try {
                const res = await mapper(data);
                this.push(res);
            } catch (e) {
                this.emit(e);
            } finally {
                inflight -= 1;
            }
        },
        async flush(callback) {
            while (inflight > 0) {
                await sleep(sleepTime);
            }
            callback();
        },
    });
}
