import { padString, getFormattedTime, getShouldBuyOrUpgrade, PORT_MAPPING, getDocument } from 'utils.js';
import { BotService } from 'services/bots.js';

const MAX_RAM = 1048576;
const MAX_BOTS = 25;

let lastServerAction = '';
let lastServerName = '';
let lastServerPrice = 0;
let lastServerTime = new Date();
let lastLogMessage = '';

/** @param {import(".").NS } ns */
export async function main(ns) {
    await handleBots(ns, true);
}

/** @param {import(".").NS } ns */
export async function handleBots(ns, showWindow = false, width = 500, height = 665, xWidthOffset = 835, yPos = 5) {
    const logsToDisable = [
        'sleep',
        'purchaseServer'
    ];
    logsToDisable.forEach(l => ns.disableLog(l));

    ns.atExit(() => {
        ns.closeTail(ns.pid);
    });

    if (showWindow) {
        ns.tail()

        await ns.sleep(100);

        ns.resizeTail(width, height);
        ns.moveTail(getDocument().body.clientWidth - xWidthOffset, yPos);
    }

    const botService = new BotService(ns);

    while (true) {
        if (showWindow) ns.clearLog();
        printBotInfo(ns);

        if (getShouldBuyOrUpgrade(ns)) {
            botService.buyOrUpgradeBots((currentServerInfo) => {
                lastServerAction = currentServerInfo.action;
                lastServerName = currentServerInfo.name;
                lastServerPrice = currentServerInfo.cost;
                lastServerTime = currentServerInfo.time || new Date();
            });
        }

        await ns.sleep(100);
    }
}

/** @param {import(".").NS } ns */
function printBotInfo(ns) {
    const bots = ns.getPurchasedServers();
    const servers = bots.map(bot => ns.getServer(bot));

    if (lastServerAction && lastServerName && lastServerPrice) {
        const message = `[${getFormattedTime(lastServerTime)}] ($${ns.formatNumber(lastServerPrice)}) ${lastServerAction} ${lastServerName}`;
        if (message !== lastLogMessage) {
            ns.writePort(PORT_MAPPING.LOG_FEED, message);
            lastLogMessage = message;
        }
    }

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
}
