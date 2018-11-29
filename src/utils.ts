/**
 * Resolve after the given delay in milliseconds
 *
 * @param ms The number of milliseconds to wait
 */
export function sleep(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

/**
 * Resolve a value after the given delay in milliseconds
 *
 * @param value Value to resolve
 * @param ms Number of milliseconds to wait
 */
export function delay<T>(value: T, ms: number): Promise<T> {
    return new Promise(resolve => {
        setTimeout(() => resolve(value), ms);
    });
}

/**
 * Resolve once the given event emitter emits the specified event
 *
 * @param emitter Event emitter to watch
 * @param event Event to watch
 */
export function once<T>(
    emitter: NodeJS.EventEmitter,
    event: string,
): Promise<T> {
    return new Promise(resolve => {
        emitter.once(event, result => {
            resolve(result);
        });
    });
}
