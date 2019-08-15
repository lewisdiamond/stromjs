export enum FlushStrategy {
    rolling = "rolling",
    sliding = "sliding",
}

export type AccumulatorByIteratee<T> = (event: T, bufferChunk: T) => boolean;
