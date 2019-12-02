import { Transform, TransformOptions } from "stream";
import { performance } from "perf_hooks";
import { sleep } from "../helpers";

export function rate(
    targetRate: number = 50,
    period: number = 1,
    options?: TransformOptions,
): Transform {
    const deltaMS = ((1 / targetRate) * 1000) / period; // Skip a full period
    let total = 0;
    const start = performance.now();
    console.log(options);
    return new Transform({
        ...options,
        async transform(data, encoding, callback) {
            const currentRate = (total / (performance.now() - start)) * 1000;
            if (targetRate && currentRate > targetRate) {
                await sleep(deltaMS);
            }
            total += 1;
            callback(undefined, data);
        },
    });
}
