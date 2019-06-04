import { Readable, Writable } from "stream";
import { ChildProcess } from "child_process";
import * as baseFunctions from "./functions";

import {
    ThroughOptions,
    TransformOptions,
    WithEncoding,
    SerializationFormats,
    JsonParseOptions,
} from "./definitions";

export function fromArray(array: any[]): NodeJS.ReadableStream {
    return baseFunctions.fromArray(array);
}

export function map<T, R>(
    mapper: (chunk: T, encoding?: string) => R,
    options?: TransformOptions,
): NodeJS.ReadWriteStream {
    return baseFunctions.map(mapper, options);
}

export function flatMap<T, R>(
    mapper:
        | ((chunk: T, encoding: string) => R[])
        | ((chunk: T, encoding: string) => Promise<R[]>),
    options?: TransformOptions,
): NodeJS.ReadWriteStream {
    return baseFunctions.flatMap(mapper, options);
}

export function filter<T>(
    mapper:
        | ((chunk: T, encoding: string) => boolean)
        | ((chunk: T, encoding: string) => Promise<boolean>),
    options?: ThroughOptions,
): NodeJS.ReadWriteStream {
    return baseFunctions.filter(mapper, options);
}

export function reduce<T, R>(
    iteratee:
        | ((previousValue: R, chunk: T, encoding: string) => R)
        | ((previousValue: R, chunk: T, encoding: string) => Promise<R>),
    initialValue: R,
    options?: TransformOptions,
): NodeJS.ReadWriteStream {
    return baseFunctions.reduce(iteratee, initialValue, options);
}

export function split(
    separator?: string | RegExp,
    options?: WithEncoding,
): NodeJS.ReadWriteStream {
    return baseFunctions.split(separator, options);
}

export function join(
    separator: string,
    options?: WithEncoding,
): NodeJS.ReadWriteStream {
    return baseFunctions.join(separator, options);
}

export function replace(
    searchValue: string | RegExp,
    replaceValue: string,
    options?: WithEncoding,
): NodeJS.ReadWriteStream {
    return baseFunctions.replace(searchValue, replaceValue, options);
}

export function parse(format: SerializationFormats): NodeJS.ReadWriteStream {
    return baseFunctions.parse(format);
}

export function stringify(options?: JsonParseOptions): NodeJS.ReadWriteStream {
    return baseFunctions.stringify(options);
}

export function collect(options?: ThroughOptions): NodeJS.ReadWriteStream {
    return baseFunctions.collect(options);
}

export function concat(
    ...streams: NodeJS.ReadableStream[]
): NodeJS.ReadableStream {
    return baseFunctions.concat(...streams);
}

export function merge(
    ...streams: NodeJS.ReadableStream[]
): NodeJS.ReadableStream {
    return baseFunctions.merge(...streams);
}

export function duplex(
    writable: Writable,
    readable: Readable,
): NodeJS.ReadWriteStream {
    return baseFunctions.duplex(writable, readable);
}

export function child(childProcess: ChildProcess): NodeJS.ReadWriteStream {
    return baseFunctions.child(childProcess);
}

export function last<T>(readable: Readable): Promise<T | null> {
    return baseFunctions.last(readable);
}

export function batch(
    batchSize?: number,
    maxBatchAge?: number,
): NodeJS.ReadWriteStream {
    return baseFunctions.batch(batchSize, maxBatchAge);
}

export function unbatch(): NodeJS.ReadWriteStream {
    return baseFunctions.unbatch();
}

export function rate(
    targetRate?: number,
    period?: number,
): NodeJS.ReadWriteStream {
    return baseFunctions.rate(targetRate, period);
}

export function parallelMap<T, R>(
    mapper: (data: T) => R,
    parallel?: number,
    sleepTime?: number,
) {
    return baseFunctions.parallelMap(mapper, parallel, sleepTime);
}
