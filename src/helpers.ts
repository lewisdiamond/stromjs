export async function sleep(time: number): Promise<{} | null> {
    return time > 0 ? new Promise(resolve => setTimeout(resolve, time)) : null;
}
