import { PORT_MAPPING, getDocument, DEFAULT_PORT_VALUE } from 'utils.js';

/** @param {import(".").NS } ns */
export async function main(ns) {
    const logsToDisable = [
        'sleep'
    ];
    logsToDisable.forEach(l => ns.disableLog(l));

    ns.atExit(() => {
        ns.closeTail(ns.pid);
    });

    ns.tail();

    await ns.sleep(100);

    ns.moveTail(getDocument().body.clientWidth - 1345, 590, ns.pid);

    let logs = [];

    while (true) {
        ns.clearLog();

        let content = ns.readPort(PORT_MAPPING.LOG_FEED);
        while (content !== DEFAULT_PORT_VALUE) {
            logs = [...logs, content];
            content = ns.readPort(PORT_MAPPING.LOG_FEED);
        }
        content = DEFAULT_PORT_VALUE;

        logs.forEach(log => ns.print(log));

        await ns.sleep(100);
    }
}