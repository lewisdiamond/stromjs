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

/**
 * Eagerly resolve to false as soon as any of the promises has resolved to a value for which the
 * predicate is falsey, or resolve to true when all of the promises have resolved to a value for which
 * the predicate is thruthy, or rejects with the reason of the first promise rejection
 *
 * @param promises Promises whose resolved values will be tested by the predicate
 * @param predicate Predicate to apply
 * @returns Promise indicating whether the predicate holds for all resolved promise values
 */
export function every<T>(
    promises: Array<Promise<T>>,
    predicate: (value: T) => boolean,
): Promise<boolean> {
    if (promises.length > 0) {
        return new Promise((resolve, reject) => {
            let resolvedCount = 0;
            let done = false;
            promises.forEach(promise => {
                promise
                    .then(value => {
                        resolvedCount++;
                        if (!done) {
                            const predicateValue = predicate(value);
                            if (!predicateValue) {
                                resolve(false);
                                done = true;
                            } else if (resolvedCount === promises.length) {
                                resolve(predicateValue);
                                done = true;
                            }
                        }
                    })
                    .catch(err => {
                        if (!done) {
                            reject(err);
                            done = true;
                        }
                    });
            });
        });
    } else {
        return Promise.resolve(true);
    }
}
