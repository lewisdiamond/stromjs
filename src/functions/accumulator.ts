import { Transform } from "stream";
import {
    AccumulatorByIteratee,
    FlushStrategy,
    TransformOptions,
} from "./baseDefinitions";
import { batch } from ".";

function _accumulator<T>(
    accumulateBy: (data: T, buffer: T[], stream: Transform) => void,
    shouldFlush: boolean = true,
    options: TransformOptions = {
        readableObjectMode: true,
        writableObjectMode: true,
    },
) {
    const buffer: T[] = [];
    return new Transform({
        ...options,
        transform(data: T, encoding, callback) {
            accumulateBy(data, buffer, this);
            callback();
        },
        flush(callback) {
            if (shouldFlush) {
                this.push(buffer);
            }
            callback();
        },
    });
}

function _sliding<T>(
    windowLength: number,
    rate: number | undefined,
    key?: string,
): (event: T, buffer: T[], stream: Transform) => void {
    return (event: T, buffer: T[], stream: Transform) => {
        if (key) {
            let index = 0;
            if (event[key] === undefined) {
                stream.emit(
                    "error",
                    new Error(
                        `Key is missing in event: (${key}, ${JSON.stringify(
                            event,
                        )})`,
                    ),
                );
                stream.resume();
                return;
            }
            while (
                index < buffer.length &&
                buffer[index][key] + windowLength <= event[key]
            ) {
                index++;
            }
            buffer.splice(0, index);
        } else if (buffer.length === windowLength) {
            buffer.shift();
        }
        buffer.push(event);
        stream.push(buffer);
    };
}

function _slidingByFunction<T>(
    rate: number | undefined,
    iteratee: AccumulatorByIteratee<T>,
): (event: T, buffer: T[], stream: Transform) => void {
    return (event: T, buffer: T[], stream: Transform) => {
        let index = 0;
        while (index < buffer.length && iteratee(event, buffer[index])) {
            index++;
        }
        buffer.splice(0, index);
        buffer.push(event);
        stream.push(buffer);
    };
}

function _rollingByFunction<T>(
    rate: number | undefined,
    iteratee: AccumulatorByIteratee<T>,
): (event: T, buffer: T[], stream: Transform) => void {
    return (event: T, buffer: T[], stream: Transform) => {
        if (iteratee) {
            if (buffer.length > 0 && iteratee(event, buffer[0])) {
                stream.push(buffer.slice(0));
                buffer.length = 0;
            }
        }
        buffer.push(event);
    };
}

function _rolling<T>(
    windowLength: number,
    rate: number | undefined,
    key?: string,
): (event: T, buffer: T[], stream: Transform) => void {
    return (event: T, buffer: T[], stream: Transform) => {
        if (key) {
            if (event[key] === undefined) {
                stream.emit(
                    "error",
                    new Error(
                        `Key is missing in event: (${key}, ${JSON.stringify(
                            event,
                        )})`,
                    ),
                );
                stream.resume();
                return;
            } else if (
                buffer.length > 0 &&
                buffer[0][key] + windowLength <= event[key]
            ) {
                stream.push(buffer.slice(0));
                buffer.length = 0;
            }
        } else if (buffer.length === windowLength) {
            stream.push(buffer.slice(0));
            buffer.length = 0;
        }
        buffer.push(event);
    };
}

export function accumulator(
    batchSize: number,
    batchRate: number | undefined,
    flushStrategy: FlushStrategy,
    keyBy?: string,
): Transform {
    if (flushStrategy === FlushStrategy.sliding) {
        return sliding(batchSize, batchRate, keyBy);
    } else if (flushStrategy === FlushStrategy.rolling) {
        return rolling(batchSize, batchRate, keyBy);
    } else {
        return batch(batchSize, batchRate);
    }
}

export function accumulatorBy<T, S extends FlushStrategy>(
    batchRate: number | undefined,
    flushStrategy: S,
    iteratee: AccumulatorByIteratee<T>,
): Transform {
    if (flushStrategy === FlushStrategy.sliding) {
        return slidingBy(batchRate, iteratee);
    } else {
        return rollingBy(batchRate, iteratee);
    }
}

function sliding(
    windowLength: number,
    rate: number | undefined,
    key?: string,
): Transform {
    return _accumulator(_sliding(windowLength, rate, key), false);
}

function slidingBy<T>(
    rate: number | undefined,
    iteratee: AccumulatorByIteratee<T>,
): Transform {
    return _accumulator(_slidingByFunction(rate, iteratee), false);
}

function rolling(
    windowLength: number,
    rate: number | undefined,
    key?: string,
): Transform {
    return _accumulator(_rolling(windowLength, rate, key));
}

function rollingBy<T>(
    rate: number | undefined,
    iteratee: AccumulatorByIteratee<T>,
): Transform {
    return _accumulator(_rollingByFunction(rate, iteratee));
}
