import { Transform, TransformOptions } from "stream";
import { batch } from ".";

export enum FlushStrategy {
    rolling = "rolling",
    sliding = "sliding",
}

export type AccumulatorByIteratee<T> = (event: T, bufferChunk: T) => boolean;

function _accumulator<T>(
    accumulateBy: (data: T, buffer: T[], stream: Transform) => void,
    shouldFlush: boolean = true,
    options: TransformOptions = {},
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
        stream.push([...buffer]);
    };
}

function _slidingByFunction<T>(
    iteratee: AccumulatorByIteratee<T>,
): (event: T, buffer: T[], stream: Transform) => void {
    return (event: T, buffer: T[], stream: Transform) => {
        let index = 0;
        while (index < buffer.length && iteratee(event, buffer[index])) {
            index++;
        }
        buffer.splice(0, index);
        buffer.push(event);
        stream.push([...buffer]);
    };
}

function _rollingByFunction<T>(
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
    flushStrategy: FlushStrategy,
    batchSize: number,
    keyBy?: string,
    options?: TransformOptions,
): Transform {
    if (flushStrategy === FlushStrategy.sliding) {
        return sliding(batchSize, keyBy, options);
    } else if (flushStrategy === FlushStrategy.rolling) {
        return rolling(batchSize, keyBy, options);
    } else {
        return batch(batchSize);
    }
}

export function accumulatorBy<T, S extends FlushStrategy>(
    flushStrategy: S,
    iteratee: AccumulatorByIteratee<T>,
    options?: TransformOptions,
): Transform {
    if (flushStrategy === FlushStrategy.sliding) {
        return slidingBy(iteratee, options);
    } else {
        return rollingBy(iteratee, options);
    }
}

function sliding(
    windowLength: number,
    key?: string,
    options?: TransformOptions,
): Transform {
    return _accumulator(_sliding(windowLength, key), false, options);
}

function slidingBy<T>(
    iteratee: AccumulatorByIteratee<T>,
    options?: TransformOptions,
): Transform {
    return _accumulator(_slidingByFunction(iteratee), false, options);
}

function rolling(
    windowLength: number,
    key?: string,
    options?: TransformOptions,
): Transform {
    return _accumulator(_rolling(windowLength, key), true, options);
}

function rollingBy<T>(
    iteratee: AccumulatorByIteratee<T>,
    options?: TransformOptions,
): Transform {
    return _accumulator(_rollingByFunction(iteratee), true, options);
}
