import { PORT_MAPPING, initPort } from 'utils.js';

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

    initPort(ns, PORT_MAPPING.HAS_ALL_MAXED_BOTS, 0);
    initPort(ns, PORT_MAPPING.DO_GANG, 0);

    ns.run('dashboard.js', 1);
    ns.run('attackServer.js', 1, '--no-open');
    ns.run('stonks.js', 1);

    ns.run('/monitoring/hud.js', 1);
    ns.run('/monitoring/log.js', 1);
    ns.run('/monitoring/showEnv.js', 1);
}
