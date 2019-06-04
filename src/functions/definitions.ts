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

export interface IBatchParams {
    batchSize?: number;
    maxBatchAge?: number;
}

export interface IRateParams {
    targetRate?: number;
    period?: number;
}

export interface IParallelMapParams<T, R> {
    mapper: (data: T) => R;
    parallel?: number;
    sleepTime?: number;
}
