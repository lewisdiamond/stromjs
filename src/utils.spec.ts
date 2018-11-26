import test from "ava";
import { expect } from "chai";
import { EventEmitter } from "events";
import { once, sleep, delay, every } from "./utils";

const TimingErrorMarginMs = 50;

test("sleep() resolves after the specified delay in milliseconds", async t => {
    const before = Date.now();
    await sleep(200);
    const after = Date.now();

    expect(after - before).gte(200);
    expect(after - before).closeTo(200, TimingErrorMarginMs);
});

test("delay() resolves a value after the specified delay in milliseconds", async t => {
    const before = Date.now();
    const value = await delay("abc", 200);
    const after = Date.now();

    expect(value).equal("abc");
    expect(after - before).gte(200);
    expect(after - before).closeTo(200, TimingErrorMarginMs);
});

test("once() resolves only after the specified event is emitted", async t => {
    const emitter = new EventEmitter();
    const before = Date.now();
    emitter.emit("noise", "is ignored");
    setTimeout(() => emitter.emit("done", "some-result"), 200);

    const result = await once(emitter, "done");
    const after = Date.now();

    expect(result).equal("some-result");
    expect(after - before).gte(200);
    expect(after - before).closeTo(200, TimingErrorMarginMs);
});

test("every() resolves to true when the predicate holds true for all resolved values", async t => {
    const before = Date.now();
    const result = await every(
        [Promise.resolve("a"), Promise.resolve("b"), delay("c", 200)],
        () => true,
    );
    const after = Date.now();
    expect(result).equal(true);
    expect(after - before).gte(200);
    expect(after - before).closeTo(200, TimingErrorMarginMs);
});

test("every() resolves to false as soon as the predicate does not hold for some resolved value", async t => {
    const before = Date.now();
    const result = await every(
        [Promise.resolve("a"), Promise.resolve("bb"), delay("c", 200)],
        (value: string) => value.length === 1,
    );
    const after = Date.now();
    expect(result).equal(false);
    expect(after - before).lt(200);
    expect(after - before).closeTo(0, TimingErrorMarginMs);
});

test("every() rejects with the reason as soon as any of the promises rejects", async t => {
    const before = Date.now();
    await t.throwsAsync(() =>
        every(
            [
                Promise.resolve("a"),
                Promise.reject(new Error("Expected")),
                delay("c", 200),
            ],
            () => true,
        ),
    );
    const after = Date.now();
    expect(after - before).lt(200);
    expect(after - before).closeTo(0, TimingErrorMarginMs);
});
