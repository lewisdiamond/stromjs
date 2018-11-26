/**
 * Resolve after the given delay in milliseconds
 *
 * @param ms - The number of milliseconds to wait
 */
export function sleep(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

/**
 * Resolve once the given event emitter emits the specified event
 *
 * @param emitter - The event emitter to watch
 * @param event - The event to watch
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
