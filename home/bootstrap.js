import { PORT_MAPPING, initPort } from 'utils.js';

/** @param {import(".").NS } ns */
export async function main(ns) {
    const startStopped = ns.args.includes('--stopped') || ns.args.includes('-b');
    const startWithStonks = ns.args.includes('--stonks') || ns.args.includes('-s');

    const openAll = ns.args.includes('--open') || ns.args.includes('-o');
    const openWindowsParam = openAll ? '' : '--no-open';

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
    ns.run('attackServer.js', 1, openWindowsParam);
    ns.run('stonks.js', 1, openWindowsParam);

    ns.run('/monitoring/hud.js', 1);
    ns.run('/monitoring/log.js', 1);
    ns.run('/monitoring/showEnv.js', 1);
}

/* bots printout
const numMaxedServers = servers.filter(server => server.maxRam === MAX_RAM).length;
    if (numMaxedServers === MAX_BOTS) {
        ns.writePort(PORT_MAPPING.HAS_ALL_MAXED_BOTS, 1);
        ns.print(`All ${MAX_BOTS} bots are maxed out`);
    } else if (numMaxedServers !== 0) {
        ns.print(`Maxed out bots: ${numMaxedServers}`);
    }

    const unMaxedservers = servers.filter(server => server.maxRam !== MAX_RAM);
    if (unMaxedservers.length !== 0) {
        ns.print('INFO\tCORES\tRAM\t\tUPCOST');
        const padSize = unMaxedservers.map(server => `${server.maxRam}`.length)[0];

        unMaxedservers.forEach(server => {
            const costToUpgrade = ns.getPurchasedServerUpgradeCost(server.hostname, server.maxRam * 2);
            ns.print(`${server.hostname}\t${server.cpuCores}\t${padString(server.maxRam, padSize)}GB\t\t$${ns.formatNumber(costToUpgrade)}`);
        });
    }
*/

/* hacknet printout
const hacknetIncome = hacknetService.getHacknetIncome();

    ns.print(`${numHackNetNodes} hacknet nodes producing $${hacknetIncome}/sec\n\n`);

    if (lastAction && lastNode && lastCost) {
        const message = `[${getFormattedTime(lastTime)}] ($${ns.formatNumber(lastCost)}) ${getActionMessage(lastAction)} ${lastNode}`;
        if (message !== lastLogMessage) {
            ns.writePort(PORT_MAPPING.LOG_FEED, message);
            lastLogMessage = message;
        }
    }
*/
