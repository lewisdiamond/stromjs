export interface ThroughOptions {
    objectMode?: boolean;
}

export interface TransformOptions {
    readableObjectMode?: boolean;
    writableObjectMode?: boolean;
}

export interface WithEncoding {
    encoding: string;
}

export enum SerializationFormats {
    utf8 = "utf8",
}

type JsonPrimitive = string | number | object;
export type JsonValue = JsonPrimitive | JsonPrimitive[];

export interface JsonParseOptions {
    pretty: boolean;
}

export enum FlushStrategy {
    sampling = "sampling",
    rolling = "rolling",
    sliding = "sliding",
}

export type AccumulatorOptions<T, R, S> = S extends FlushStrategy.sampling
    ? SamplingFlushOptions<T, R>
    : S extends FlushStrategy.sliding
    ? SlidingFlushOptions<T, R>
    : S extends FlushStrategy.rolling
    ? RollingFlushOptions<T, R>
    : never;

export interface RollingFlushOptions<T, R> {
    windowLength: number;
    flushMapper?: (flushed: Array<T>) => Array<R>;
    timeout?: number;
}

export interface SlidingFlushOptions<T, R> {
    windowLength: number;
    windowMapper?: (flushed: Array<T>) => Array<R>;
    timeout?: number;
}

export interface SlidingFlushResult<T> {
    first: T;
}

export interface SamplingFlushOptions<T, R> {
    condition: (event: T, buffer: Array<T>) => boolean;
    flushMapper?: (flushed: Array<T>) => Array<R>;
    timeout?: number;
}

export interface SamplingFlushResult<T> {
    flushed: boolean;
    flush?: Array<T> | null;
}
