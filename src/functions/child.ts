import { ChildProcess } from "child_process";
import { duplex } from "./duplex";

export function child(childProcess: ChildProcess) {
    if (childProcess.stdin === null) {
        throw new Error("childProcess.stdin is null");
    } else if (childProcess.stdout === null) {
        throw new Error("childProcess.stdout is null");
    }
    return duplex(childProcess.stdin, childProcess.stdout);
}
