import { Transform } from "stream";
import {
    AccumulatorByIteratee,
    FlushStrategy,
    TransformOptions,
} from "./baseDefinitions";
import { batch, rate as _rate } from ".";

function _accumulator<T>(
    accumulateBy: (data: T, buffer: T[], stream: Transform) => void,
    rate?: number,
    shouldFlush: boolean = true,
    options: TransformOptions = {
        readableObjectMode: true,
        writableObjectMode: true,
    },
) {
    const buffer: T[] = [];
    const stream = new Transform({
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
    if (rate) {
        stream.pipe(_rate(rate));
    }
    return stream;
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
        stream.push(buffer);
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
        stream.push(buffer);
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
    options: TransformOptions & { rate?: number } = {
        readableObjectMode: true,
        writableObjectMode: true,
    },
): Transform {
    if (flushStrategy === FlushStrategy.sliding) {
        return sliding(batchSize, keyBy, options);
    } else if (flushStrategy === FlushStrategy.rolling) {
        return rolling(batchSize, keyBy, options);
    } else {
        return batch(batchSize, options.rate);
    }
}

export function accumulatorBy<T, S extends FlushStrategy>(
    flushStrategy: S,
    iteratee: AccumulatorByIteratee<T>,
    options: TransformOptions & { rate?: number } = {
        readableObjectMode: true,
        writableObjectMode: true,
    },
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
    options?: TransformOptions & { rate?: number },
): Transform {
    return _accumulator(
        _sliding(windowLength, key),
        options && options.rate,
        false,
        options,
    );
}

function slidingBy<T>(
    iteratee: AccumulatorByIteratee<T>,
    options?: TransformOptions & { rate?: number },
): Transform {
    return _accumulator(
        _slidingByFunction(iteratee),
        options && options.rate,
        false,
        options,
    );
}

function rolling(
    windowLength: number,
    key?: string,
    options?: TransformOptions & { rate?: number },
): Transform {
    return _accumulator(
        _rolling(windowLength, key),
        options && options.rate,
        true,
        options,
    );
}

function rollingBy<T>(
    iteratee: AccumulatorByIteratee<T>,
    options?: TransformOptions & { rate?: number },
): Transform {
    return _accumulator(
        _rollingByFunction(iteratee),
        options && options.rate,
        true,
        options,
    );
}
