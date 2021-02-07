import { Readable, Stream, Writable } from "stream";

// Copyright MIT ykdr2017 https://github.com/ykdr2017/ts-deepcopy
function _deepClone<T>(tgt: T): T {
    let cp: T;
    if (tgt === null) {
        cp = tgt;
    } else if (tgt instanceof Date) {
        cp = (new Date(tgt.getTime()) as unknown) as T;
    } else if (tgt instanceof Array) {
        cp = ([] as unknown) as T;
        tgt.forEach((v) => {
            (cp as any).push(v);
        });
        cp = (cp as any).map((n: any) => _deepClone<any>(n));
    } else if (typeof tgt === "object" && tgt !== {}) {
        const tmp: object = { ...(tgt as any) };
        cp = tmp as any;
        Object.keys(cp).forEach((k) => {
            (cp as any)[k] = _deepClone<any>((cp as any)[k]);
        });
    } else {
        cp = tgt;
    }
    return cp;
}
// End copyright

function _deepCloneJson<T>(o: T): T {
    return JSON.parse(JSON.stringify(o));
}
export async function sleep(time: number): Promise<{} | null> {
    return time > 0
        ? new Promise((resolve) => setTimeout(resolve, time))
        : null;
}

export function isReadable(stream: Stream): stream is Readable {
    return (
        (stream as Readable).pipe !== undefined &&
        (stream as Readable).readable === true
    );
}

export function isWritable(stream: Stream): stream is Writable {
    return (
        (stream as Writable).write !== undefined &&
        (stream as Writable).writable === true
    );
}

export function shallowClone<T>(t: T): T {
    return { ...t };
}

export function deepClone<T>(t: T): T {
    return _deepClone(t);
}

export function shallowFreeze<T>(t: T): T {
    return Object.freeze(t);
}

export function deepFreeze<T>(t: T): T {
    // Copyright https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
    // Retrieve the property names defined on object
    const propNames = Object.getOwnPropertyNames(t);

    // Freeze properties before freezing self
    for (const name of propNames) {
        const value = t[name];

        if (value && typeof value === "object" && !Object.isFrozen(value)) {
            deepFreeze(value);
        }
    }

    return Object.freeze(t);
}
