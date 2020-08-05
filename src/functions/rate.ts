import { Transform, TransformOptions } from "stream";
import { performance } from "perf_hooks";
import { sleep } from "../helpers";

export enum Behavior {
    BUFFER = 0,
    DROP = 1,
}

export interface RateOptions {
    window?: number;
    behavior?: Behavior;
}

export function rate(
    targetRate: number = 50,
    period: number = 1,
    options?: TransformOptions & RateOptions,
): Transform {
    const deltaMS = ((1 / targetRate) * 1000) / period; // Skip a full period
    let total = 0;
    const window = options?.window || Infinity;
    const behavior = options?.behavior || Behavior.BUFFER;
    let start = performance.now();
    return new Transform({
        ...options,
        async transform(data, encoding, callback) {
            const now = performance.now();
            if (now - start >= window) {
                start = now - window;
            }
            const currentRate = (total / (now - start)) * 1000;
            if (targetRate && currentRate > targetRate) {
                if (behavior === Behavior.DROP) {
                    callback(undefined);
                    return;
                } else {
                    await sleep(deltaMS);
                }
            }
            total += 1;
            callback(undefined, data);
        },
    });
}
