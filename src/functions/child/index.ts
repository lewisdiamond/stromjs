import { ChildProcess } from "child_process";
import { duplex } from "../baseFunctions";
/**
 * Return a Duplex stream from a child process' stdin and stdout
 * @param childProcess Child process from which to create duplex stream
 */
export function child(childProcess: ChildProcess) {
    if (childProcess.stdin === null) {
        throw new Error("childProcess.stdin is null");
    } else if (childProcess.stdout === null) {
        throw new Error("childProcess.stdout is null");
    }
    return duplex(childProcess.stdin, childProcess.stdout);
}
