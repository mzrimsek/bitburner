import { PORT_MAPPING } from 'utils.js';

/** @param {import(".").NS } ns */
export async function main(ns) {
    const startStopped = ns.args.includes('--stopped');
    const startWithStonks = ns.args.includes('--stonks');

    ns.killall('home', true);

    // init ports
    if (startStopped) {
        initPort(ns, PORT_MAPPING.DO_BUY, 0);
    } else {
        initPort(ns, PORT_MAPPING.DO_BUY, 1);
    }

    if (startWithStonks) {
        initPort(ns, PORT_MAPPING.DO_STONKS, 1);
    } else {
        initPort(ns, PORT_MAPPING.DO_STONKS, 0);
    }

    initPort(ns, PORT_MAPPING.HAS_MAX_BOTS, 0);

    ns.run('hacknet.js', 1, 100);
    ns.run('bots.js', 100);
    ns.run('attackServer.js', 1);
    ns.run('stonks.js', 1);

    ns.run('log.js', 1);
    ns.run('showEnv.js', 1);
    ns.run('hud.js', 1);
}

function initPort(ns, portNum, initValue) {
    ns.clearPort(portNum);
    ns.writePort(portNum, initValue);
}