import { PORT_MAPPING, padString, getDocument } from 'utils.js';

/** @param {import(".").NS } ns */
export async function main(ns) {
    const logsToDisable = [
        'sleep',
    ]
    logsToDisable.forEach(l => ns.disableLog(l))

    ns.atExit(() => {
        ns.closeTail(ns.pid);
    });

    ns.tail()

    await ns.sleep(100);
    
    ns.resizeTail(300, 200, ns.pid);
    ns.moveTail(getDocument().body.clientWidth - 315, 635, ns.pid);
    
    while (true) {
        ns.clearLog();

        ns.print('INFO\tNAME\tVAL');
        printPorts(ns);
        await ns.sleep(100);
    }
}

function printPort(ns, portNum, name) {
    const portVal = ns.peek(portNum);
    if (portNum < 100) {
        ns.print(`${portNum}\t${name}\t${portVal}\n`);
    }
}

function printPorts(ns) {
    const length = Object.keys(PORT_MAPPING).map(key => key.length).sort((a,b) => b-a)[0];
    Object.keys(PORT_MAPPING).forEach(name => {
        const envName = padString(name, length);
        printPort(ns, PORT_MAPPING[name], envName);
    });
}