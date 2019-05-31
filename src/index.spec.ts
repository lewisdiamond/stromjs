import * as cp from "child_process";
import test from "ava";
import { expect } from "chai";
import { performance } from "perf_hooks";
import { Readable } from "stream";
import {
    fromArray,
    map,
    flatMap,
    filter,
    split,
    join,
    replace,
    parse,
    stringify,
    collect,
    concat,
    merge,
    duplex,
    child,
    reduce,
    last,
    batch,
    unbatch,
    rate,
    parallelMap,
} from ".";

test.cb("fromArray() streams array elements in flowing mode", t => {
    t.plan(3);
    const elements = ["a", "b", "c"];
    const stream = fromArray(elements);
    let i = 0;
    stream
        .on("data", (element: string) => {
            expect(element).to.equal(elements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);
});

test.cb("fromArray() streams array elements in paused mode", t => {
    t.plan(3);
    const elements = ["a", "b", "c"];
    const stream = fromArray(elements);
    let i = 0;
    stream
        .on("readable", () => {
            let element = stream.read();
            while (element !== null) {
                expect(element).to.equal(elements[i]);
                t.pass();
                i++;
                element = stream.read();
            }
        })
        .on("error", t.end)
        .on("end", t.end);
});

test.cb("fromArray() ends immediately if there are no array elements", t => {
    t.plan(0);
    fromArray([])
        .on("data", () => t.fail())
        .on("error", t.end)
        .on("end", t.end);
});

test.cb("map() maps elements synchronously", t => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["A", "B", "C"];
    let i = 0;
    source
        .pipe(map((element: string) => element.toUpperCase()))
        .on("data", (element: string) => {
            expect(element).to.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("map() maps elements asynchronously", t => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["A", "B", "C"];
    let i = 0;
    source
        .pipe(
            map(async (element: string) => {
                await Promise.resolve();
                return element.toUpperCase();
            }),
        )
        .on("data", (element: string) => {
            expect(element).to.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("map() emits errors during synchronous mapping", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    source
        .pipe(
            map((element: string) => {
                if (element !== "a") {
                    throw new Error("Failed mapping");
                }
                return element.toUpperCase();
            }),
        )
        .resume()
        .on("error", err => {
            expect(err.message).to.equal("Failed mapping");
            t.pass();
        })
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("map() emits errors during asynchronous mapping", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    source
        .pipe(
            map(async (element: string) => {
                await Promise.resolve();
                if (element !== "a") {
                    throw new Error("Failed mapping");
                }
                return element.toUpperCase();
            }),
        )
        .resume()
        .on("error", err => {
            expect(err.message).to.equal("Failed mapping");
            t.pass();
        })
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("flatMap() maps elements synchronously", t => {
    t.plan(6);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "A", "b", "B", "c", "C"];
    let i = 0;
    source
        .pipe(flatMap((element: string) => [element, element.toUpperCase()]))
        .on("data", (element: string) => {
            expect(element).to.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("flatMap() maps elements asynchronously", t => {
    t.plan(6);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "A", "b", "B", "c", "C"];
    let i = 0;
    source
        .pipe(
            flatMap(async (element: string) => {
                await Promise.resolve();
                return [element, element.toUpperCase()];
            }),
        )
        .on("data", (element: string) => {
            expect(element).to.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("flatMap() emits errors during synchronous mapping", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    source
        .pipe(
            flatMap((element: string) => {
                if (element !== "a") {
                    throw new Error("Failed mapping");
                }
                return [element, element.toUpperCase()];
            }),
        )
        .resume()
        .on("error", err => {
            expect(err.message).to.equal("Failed mapping");
            t.pass();
        })
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("flatMap() emits errors during asynchronous mapping", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    source
        .pipe(
            flatMap(async (element: string) => {
                await Promise.resolve();
                if (element !== "a") {
                    throw new Error("Failed mapping");
                }
                return [element, element.toUpperCase()];
            }),
        )
        .resume()
        .on("error", err => {
            expect(err.message).to.equal("Failed mapping");
            t.pass();
        })
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("filter() filters elements synchronously", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "c"];
    let i = 0;
    source
        .pipe(filter((element: string) => element !== "b"))
        .on("data", (element: string) => {
            expect(element).to.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("filter() filters elements asynchronously", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "c"];
    let i = 0;
    source
        .pipe(
            filter(async (element: string) => {
                await Promise.resolve();
                return element !== "b";
            }),
        )
        .on("data", (element: string) => {
            expect(element).to.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("filter() emits errors during synchronous filtering", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    source
        .pipe(
            filter((element: string) => {
                if (element !== "a") {
                    throw new Error("Failed filtering");
                }
                return true;
            }),
        )
        .resume()
        .on("error", err => {
            expect(err.message).to.equal("Failed filtering");
            t.pass();
        })
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("filter() emits errors during asynchronous filtering", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    source
        .pipe(
            filter(async (element: string) => {
                await Promise.resolve();
                if (element !== "a") {
                    throw new Error("Failed filtering");
                }
                return true;
            }),
        )
        .resume()
        .on("error", err => {
            expect(err.message).to.equal("Failed filtering");
            t.pass();
        })
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("reduce() reduces elements synchronously", t => {
    t.plan(1);
    const source = new Readable({ objectMode: true });
    const expectedValue = 6;
    source
        .pipe(reduce((acc: number, element: string) => acc + element.length, 0))
        .on("data", (element: string) => {
            expect(element).to.equal(expectedValue);
            t.pass();
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("ab");
    source.push("cd");
    source.push("ef");
    source.push(null);
});

test.cb("reduce() reduces elements asynchronously", t => {
    t.plan(1);
    const source = new Readable({ objectMode: true });
    const expectedValue = 6;
    source
        .pipe(
            reduce(async (acc: number, element: string) => {
                await Promise.resolve();
                return acc + element.length;
            }, 0),
        )
        .on("data", (element: string) => {
            expect(element).to.equal(expectedValue);
            t.pass();
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("ab");
    source.push("cd");
    source.push("ef");
    source.push(null);
});

test.cb("reduce() emits errors during synchronous reduce", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    source
        .pipe(
            reduce((acc: number, element: string) => {
                if (element !== "ab") {
                    throw new Error("Failed reduce");
                }
                return acc + element.length;
            }, 0),
        )
        .resume()
        .on("error", err => {
            expect(err.message).to.equal("Failed reduce");
            t.pass();
        })
        .on("end", t.end);

    source.push("ab");
    source.push("cd");
    source.push("ef");
    source.push(null);
});

test.cb("reduce() emits errors during asynchronous reduce", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    source
        .pipe(
            reduce(async (acc: number, element: string) => {
                await Promise.resolve();
                if (element !== "ab") {
                    throw new Error("Failed mapping");
                }
                return acc + element.length;
            }, 0),
        )
        .resume()
        .on("error", err => {
            expect(err.message).to.equal("Failed mapping");
            t.pass();
        })
        .on("end", t.end);

    source.push("ab");
    source.push("cd");
    source.push("ef");
    source.push(null);
});

test.cb("split() splits chunks using the default separator (\\n)", t => {
    t.plan(5);
    const source = new Readable({ objectMode: true });
    const expectedParts = ["ab", "c", "d", "ef", ""];
    let i = 0;
    source
        .pipe(split())
        .on("data", part => {
            expect(part).to.equal(expectedParts[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("ab\n");
    source.push("c");
    source.push("\n");
    source.push("d");
    source.push("\nef\n");
    source.push(null);
});

test.cb("split() splits chunks using the specified separator", t => {
    t.plan(6);
    const source = new Readable({ objectMode: true });
    const expectedParts = ["ab", "c", "d", "e", "f", ""];
    let i = 0;
    source
        .pipe(split("|"))
        .on("data", (part: string) => {
            expect(part).to.equal(expectedParts[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("ab|");
    source.push("c|d");
    source.push("|");
    source.push("e");
    source.push("|f|");
    source.push(null);
});

test.cb(
    "split() splits utf8 encoded buffers using the specified separator",
    t => {
        t.plan(3);
        const expectedElements = ["a", "b", "c"];
        let i = 0;
        const through = split(",");
        const buf = Buffer.from("a,b,c");
        through
            .on("data", element => {
                expect(element).to.equal(expectedElements[i]);
                i++;
                t.pass();
            })
            .on("error", t.end)
            .on("end", t.end);

        for (let j = 0; j < buf.length; ++j) {
            through.write(buf.slice(j, j + 1));
        }
        through.end();
    },
);

test.cb(
    "split() splits utf8 encoded buffers with multi-byte characters using the specified separator",
    t => {
        t.plan(3);
        const expectedElements = ["一", "一", "一"];
        let i = 0;
        const through = split(",");
        const buf = Buffer.from("一,一,一"); // Those spaces are multi-byte utf8 characters (code: 4E00)
        through
            .on("data", element => {
                expect(element).to.equal(expectedElements[i]);
                i++;
                t.pass();
            })
            .on("error", t.end)
            .on("end", t.end);

        for (let j = 0; j < buf.length; ++j) {
            through.write(buf.slice(j, j + 1));
        }
        through.end();
    },
);

test.cb("join() joins chunks using the specified separator", t => {
    t.plan(9);
    const source = new Readable({ objectMode: true });
    const expectedParts = ["ab|", "|", "c|d", "|", "|", "|", "e", "|", "|f|"];
    let i = 0;
    source
        .pipe(join("|"))
        .on("data", part => {
            expect(part).to.equal(expectedParts[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("ab|");
    source.push("c|d");
    source.push("|");
    source.push("e");
    source.push("|f|");
    source.push(null);
});

test.cb(
    "join() joins chunks using the specified separator without breaking up multi-byte characters " +
        "spanning multiple chunks",
    t => {
        t.plan(5);
        const source = new Readable({ objectMode: true });
        const expectedParts = ["ø", "|", "ö", "|", "一"];
        let i = 0;
        source
            .pipe(join("|"))
            .on("data", part => {
                expect(part).to.equal(expectedParts[i]);
                t.pass();
                i++;
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push(Buffer.from("ø").slice(0, 1)); // 2-byte character spanning two chunks
        source.push(Buffer.from("ø").slice(1, 2));
        source.push(Buffer.from("ö").slice(0, 1)); // 2-byte character spanning two chunks
        source.push(Buffer.from("ö").slice(1, 2));
        source.push(Buffer.from("一").slice(0, 1)); // 3-byte character spanning three chunks
        source.push(Buffer.from("一").slice(1, 2));
        source.push(Buffer.from("一").slice(2, 3));
        source.push(null);
    },
);

test.cb(
    "replace() replaces occurrences of the given string in the streamed elements with the specified " +
        "replacement string",
    t => {
        t.plan(3);
        const source = new Readable({ objectMode: true });
        const expectedElements = ["abc", "xyf", "ghi"];
        let i = 0;
        source
            .pipe(replace("de", "xy"))
            .on("data", part => {
                expect(part).to.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push("abc");
        source.push("def");
        source.push("ghi");
        source.push(null);
    },
);

test.cb(
    "replace() replaces occurrences of the given regular expression in the streamed elements with " +
        "the specified replacement string",
    t => {
        t.plan(3);
        const source = new Readable({ objectMode: true });
        const expectedElements = ["abc", "xyz", "ghi"];
        let i = 0;
        source
            .pipe(replace(/^def$/, "xyz"))
            .on("data", part => {
                expect(part).to.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push("abc");
        source.push("def");
        source.push("ghi");
        source.push(null);
    },
);

test.cb(
    "replace() replaces occurrences of the given multi-byte character even if it spans multiple chunks",
    t => {
        t.plan(3);
        const source = new Readable({ objectMode: true });
        const expectedElements = ["ø", "O", "a"];
        let i = 0;
        source
            .pipe(replace("ö", "O"))
            .on("data", part => {
                expect(part).to.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push(Buffer.from("ø").slice(0, 1)); // 2-byte character spanning two chunks
        source.push(Buffer.from("ø").slice(1, 2));
        source.push(Buffer.from("ö").slice(0, 1)); // 2-byte character spanning two chunks
        source.push(Buffer.from("ö").slice(1, 2));
        source.push("a");
        source.push(null);
    },
);

test.cb("parse() parses the streamed elements as JSON", t => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["abc", {}, []];
    let i = 0;
    source
        .pipe(parse())
        .on("data", part => {
            expect(part).to.deep.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push('"abc"');
    source.push("{}");
    source.push("[]");
    source.push(null);
});

test.cb("parse() emits errors on invalid JSON", t => {
    t.plan(2);
    const source = new Readable({ objectMode: true });
    source
        .pipe(parse())
        .resume()
        .on("error", () => t.pass())
        .on("end", t.end);

    source.push("{}");
    source.push({});
    source.push([]);
    source.push(null);
});

test.cb("stringify() stringifies the streamed elements as JSON", t => {
    t.plan(4);
    const source = new Readable({ objectMode: true });
    const expectedElements = [
        '"abc"',
        "0",
        '{"a":"a","b":"b","c":"c"}',
        '["a","b","c"]',
    ];
    let i = 0;
    source
        .pipe(stringify())
        .on("data", part => {
            expect(part).to.deep.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("abc");
    source.push(0);
    source.push({ a: "a", b: "b", c: "c" });
    source.push(["a", "b", "c"]);
    source.push(null);
});

test.cb(
    "stringify() stringifies the streamed elements as pretty-printed JSON",
    t => {
        t.plan(4);
        const source = new Readable({ objectMode: true });
        const expectedElements = [
            '"abc"',
            "0",
            '{\n  "a": "a",\n  "b": "b",\n  "c": "c"\n}',
            '[\n  "a",\n  "b",\n  "c"\n]',
        ];
        let i = 0;
        source
            .pipe(stringify({ pretty: true }))
            .on("data", part => {
                expect(part).to.deep.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push("abc");
        source.push(0);
        source.push({ a: "a", b: "b", c: "c" });
        source.push(["a", "b", "c"]);
        source.push(null);
    },
);

test.cb(
    "collect() collects streamed elements into an array (object, flowing mode)",
    t => {
        t.plan(1);
        const source = new Readable({ objectMode: true });

        source
            .pipe(collect({ objectMode: true }))
            .on("data", collected => {
                expect(collected).to.deep.equal(["a", "b", "c"]);
                t.pass();
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    },
);

test.cb(
    "collect() collects streamed elements into an array (object, paused mode)",
    t => {
        t.plan(1);
        const source = new Readable({ objectMode: true });
        const collector = source.pipe(collect({ objectMode: true }));

        collector
            .on("readable", () => {
                let collected = collector.read();
                while (collected !== null) {
                    expect(collected).to.deep.equal(["a", "b", "c"]);
                    t.pass();
                    collected = collector.read();
                }
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    },
);

test.cb(
    "collect() collects streamed bytes into a buffer (non-object, flowing mode)",
    t => {
        t.plan(1);
        const source = new Readable({ objectMode: false });

        source
            .pipe(collect())
            .on("data", collected => {
                expect(collected).to.deep.equal(Buffer.from("abc"));
                t.pass();
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    },
);

test.cb(
    "collect() collects streamed bytes into a buffer (non-object, paused mode)",
    t => {
        t.plan(1);
        const source = new Readable({ objectMode: false });
        const collector = source.pipe(collect({ objectMode: false }));
        collector
            .on("readable", () => {
                let collected = collector.read();
                while (collected !== null) {
                    expect(collected).to.deep.equal(Buffer.from("abc"));
                    t.pass();
                    collected = collector.read();
                }
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    },
);

test.cb(
    "collect() emits an empty array if the source was empty (object mode)",
    t => {
        t.plan(1);
        const source = new Readable({ objectMode: true });
        const collector = source.pipe(collect({ objectMode: true }));
        collector
            .on("data", collected => {
                expect(collected).to.deep.equal([]);
                t.pass();
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push(null);
    },
);

test.cb(
    "collect() emits nothing if the source was empty (non-object mode)",
    t => {
        t.plan(0);
        const source = new Readable({ objectMode: false });
        const collector = source.pipe(collect({ objectMode: false }));
        collector
            .on("data", () => t.fail())
            .on("error", t.end)
            .on("end", t.end);

        source.push(null);
    },
);

test.cb(
    "concat() concatenates multiple readable streams (object, flowing mode)",
    t => {
        t.plan(6);
        const source1 = new Readable({ objectMode: true });
        const source2 = new Readable({ objectMode: true });
        const expectedElements = ["a", "b", "c", "d", "e", "f"];
        let i = 0;
        concat(source1, source2)
            .on("data", (element: string) => {
                expect(element).to.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", t.end)
            .on("end", t.end);

        source1.push("a");
        source2.push("d");
        source1.push("b");
        source2.push("e");
        source1.push("c");
        source2.push("f");
        source2.push(null);
        source1.push(null);
    },
);

test.cb(
    "concat() concatenates multiple readable streams (object, paused mode)",
    t => {
        t.plan(6);
        const source1 = new Readable({ objectMode: true });
        const source2 = new Readable({ objectMode: true });
        const expectedElements = ["a", "b", "c", "d", "e", "f"];
        let i = 0;
        const concatenation = concat(source1, source2)
            .on("readable", () => {
                let element = concatenation.read();
                while (element !== null) {
                    expect(element).to.equal(expectedElements[i]);
                    t.pass();
                    i++;
                    element = concatenation.read();
                }
            })
            .on("error", t.end)
            .on("end", t.end);

        source1.push("a");
        source2.push("d");
        source1.push("b");
        source2.push("e");
        source1.push("c");
        source2.push("f");
        source2.push(null);
        source1.push(null);
    },
);

test.cb(
    "concat() concatenates multiple readable streams (non-object, flowing mode)",
    t => {
        t.plan(6);
        const source1 = new Readable({ objectMode: false });
        const source2 = new Readable({ objectMode: false });
        const expectedElements = ["a", "b", "c", "d", "e", "f"];
        let i = 0;
        concat(source1, source2)
            .on("data", (element: string) => {
                expect(element).to.deep.equal(Buffer.from(expectedElements[i]));
                t.pass();
                i++;
            })
            .on("error", t.end)
            .on("end", t.end);

        source1.push("a");
        source2.push("d");
        source1.push("b");
        source2.push("e");
        source1.push("c");
        source2.push("f");
        source2.push(null);
        source1.push(null);
    },
);

test.cb(
    "concat() concatenates multiple readable streams (non-object, paused mode)",
    t => {
        t.plan(6);
        const source1 = new Readable({ objectMode: false, read: () => ({}) });
        const source2 = new Readable({ objectMode: false, read: () => ({}) });
        const expectedElements = ["a", "b", "c", "d", "e", "f"];
        let i = 0;
        const concatenation = concat(source1, source2)
            .on("readable", () => {
                let element = concatenation.read();
                while (element !== null) {
                    expect(element).to.deep.equal(
                        Buffer.from(expectedElements[i]),
                    );
                    t.pass();
                    i++;
                    element = concatenation.read();
                }
            })
            .on("error", t.end)
            .on("end", t.end);

        source1.push("a");
        setTimeout(() => source2.push("d"), 10);
        setTimeout(() => source1.push("b"), 20);
        setTimeout(() => source2.push("e"), 30);
        setTimeout(() => source1.push("c"), 40);
        setTimeout(() => source2.push("f"), 50);
        setTimeout(() => source2.push(null), 60);
        setTimeout(() => source1.push(null), 70);
    },
);

test.cb("concat() concatenates a single readable stream (object mode)", t => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c", "d", "e", "f"];
    let i = 0;
    concat(source)
        .on("data", (element: string) => {
            expect(element).to.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb(
    "concat() concatenates a single readable stream (non-object mode)",
    t => {
        t.plan(3);
        const source = new Readable({ objectMode: false });
        const expectedElements = ["a", "b", "c", "d", "e", "f"];
        let i = 0;
        concat(source)
            .on("data", (element: string) => {
                expect(element).to.deep.equal(Buffer.from(expectedElements[i]));
                t.pass();
                i++;
            })
            .on("error", t.end)
            .on("end", t.end);

        source.push("a");
        source.push("b");
        source.push("c");
        source.push(null);
    },
);

test.cb("concat() concatenates empty list of readable streams", t => {
    t.plan(0);
    concat()
        .pipe(collect())
        .on("data", _ => {
            t.fail();
        })
        .on("error", t.end)
        .on("end", t.end);
});

test.cb(
    "merge() merges multiple readable streams in chunk arrival order",
    t => {
        t.plan(6);
        const source1 = new Readable({ objectMode: true, read: () => ({}) });
        const source2 = new Readable({ objectMode: true, read: () => ({}) });
        const expectedElements = ["a", "d", "b", "e", "c", "f"];
        let i = 0;
        merge(source1, source2)
            .on("data", (element: string) => {
                expect(element).to.equal(expectedElements[i]);
                t.pass();
                i++;
            })
            .on("error", t.end)
            .on("end", t.end);

        source1.push("a");
        setTimeout(() => source2.push("d"), 10);
        setTimeout(() => source1.push("b"), 20);
        setTimeout(() => source2.push("e"), 30);
        setTimeout(() => source1.push("c"), 40);
        setTimeout(() => source2.push("f"), 50);
        setTimeout(() => source2.push(null), 60);
        setTimeout(() => source1.push(null), 70);
    },
);

test.cb("merge() merges a readable stream", t => {
    t.plan(3);
    const source = new Readable({ objectMode: true, read: () => ({}) });
    const expectedElements = ["a", "b", "c"];
    let i = 0;
    merge(source)
        .on("data", (element: string) => {
            expect(element).to.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("merge() merges an empty list of readable streams", t => {
    t.plan(0);
    merge()
        .on("data", () => t.pass())
        .on("error", t.end)
        .on("end", t.end);
});

test.cb(
    "duplex() combines a writable and readable stream into a ReadWrite stream",
    t => {
        t.plan(1);
        const source = new Readable();
        const catProcess = cp.exec("cat");
        let out = "";
        source
            .pipe(duplex(catProcess.stdin, catProcess.stdout))
            .on("data", chunk => (out += chunk))
            .on("error", t.end)
            .on("end", () => {
                expect(out).to.equal("abcdef");
                t.pass();
                t.end();
            });
        source.push("ab");
        source.push("cd");
        source.push("ef");
        source.push(null);
    },
);

test.cb(
    "child() allows easily writing to child process stdin and reading from its stdout",
    t => {
        t.plan(1);
        const source = new Readable();
        const catProcess = cp.exec("cat");
        let out = "";
        source
            .pipe(child(catProcess))
            .on("data", chunk => (out += chunk))
            .on("error", t.end)
            .on("end", () => {
                expect(out).to.equal("abcdef");
                t.pass();
                t.end();
            });
        source.push("ab");
        source.push("cd");
        source.push("ef");
        source.push(null);
    },
);

test("last() resolves to the last chunk streamed by the given readable stream", async t => {
    const source = new Readable({ objectMode: true });
    const lastPromise = last(source);
    source.push("ab");
    source.push("cd");
    source.push("ef");
    source.push(null);
    const lastChunk = await lastPromise;
    expect(lastChunk).to.equal("ef");
});

test.cb("batch() batches chunks together", t => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = [["a", "b", "c"], ["d", "e", "f"], ["g"]];
    let i = 0;
    source
        .pipe(batch(3))
        .on("data", (element: string[]) => {
            expect(element).to.deep.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push("d");
    source.push("e");
    source.push("f");
    source.push("g");
    source.push(null);
});

test.cb("unbatch() unbatches", t => {
    t.plan(3);
    const source = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c"];
    let i = 0;
    source
        .pipe(batch(3))
        .pipe(unbatch())
        .on("data", (element: string) => {
            expect(element).to.equal(expectedElements[i]);
            t.pass();
            i++;
        })
        .on("error", t.end)
        .on("end", t.end);

    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);
});

test.cb("rate() sends data at desired rate", t => {
    t.plan(9);
    const fastRate = 500;
    const medRate = 50;
    const slowRate = 1;
    const sourceFast = new Readable({ objectMode: true });
    const sourceMed = new Readable({ objectMode: true });
    const sourceSlow = new Readable({ objectMode: true });
    const expectedElements = ["a", "b", "c"];
    const start = performance.now();
    let i = 0;
    let j = 0;
    let k = 0;

    sourceFast
        .pipe(rate(fastRate))
        .on("data", (element: string[]) => {
            const currentRate = (i / (performance.now() - start)) * 1000;
            expect(element).to.deep.equal(expectedElements[i]);
            expect(currentRate).lessThan(fastRate);
            t.pass();
            i++;
        })
        .on("error", t.end);

    sourceMed
        .pipe(rate(medRate))
        .on("data", (element: string[]) => {
            const currentRate = (j / (performance.now() - start)) * 1000;
            expect(element).to.deep.equal(expectedElements[j]);
            expect(currentRate).lessThan(medRate);
            t.pass();
            j++;
        })
        .on("error", t.end);

    sourceSlow
        .pipe(rate(slowRate))
        .on("data", (element: string[]) => {
            const currentRate = (k / (performance.now() - start)) * 1000;
            expect(element).to.deep.equal(expectedElements[k]);
            expect(currentRate).lessThan(slowRate);
            t.pass();
            k++;
        })
        .on("error", t.end)
        .on("end", t.end);

    sourceFast.push("a");
    sourceFast.push("b");
    sourceFast.push("c");
    sourceFast.push(null);
    sourceMed.push("a");
    sourceMed.push("b");
    sourceMed.push("c");
    sourceMed.push(null);
    sourceSlow.push("a");
    sourceSlow.push("b");
    sourceSlow.push("c");
    sourceSlow.push(null);
});

test.cb("parallel() parallel mapping", t => {
    t.plan(5);
    const source = new Readable({ objectMode: true });
    const expectedElements = [
        "a_processed",
        "b_processed",
        "c_processed",
        "d_processed",
        "e_processed",
    ];
    const orderedResults: string[] = [];
    source
        .pipe(parallelMap(2, data => data + "_processed"))
        .on("data", (element: string) => {
            t.true(expectedElements.includes(element));
            orderedResults.push(element);
        })
        .on("error", t.end)
        .on("end", () => {
            expect(orderedResults[0]).to.equal("a_processed")
            expect(orderedResults[1]).to.equal("b_processed")
            expect(orderedResults[2]).to.equal("d_processed")
            expect(orderedResults[3]).to.equal("c_processed")
            expect(orderedResults[4]).to.equal("e_processed")
            t.end();
        });

    source.push("a");
    source.push("b");
    source.push("c");
    source.push("d");
    source.push("e");
    source.push(null);
});
