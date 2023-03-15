import { PORT_MAPPING, getDocument } from 'utils.js';

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
        while (content !== 'NULL PORT DATA') {
            logs = [...logs, content];
            content = ns.readPort(PORT_MAPPING.LOG_FEED);
        }
        content = 'NULL PORT DATA';

        logs.forEach(log => ns.print(log));

        await ns.sleep(100);
    }
}