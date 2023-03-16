import { log as utilLog, padString, getFormattedTime, getShouldBuyOrUpgrade, PORT_MAPPING, getDocument } from 'utils.js';

const MAX_RAM = 1048576;
const MAX_BOTS = 25;
const BUY = 'BUY';
const UPGRADE = 'UPGRADE';

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
    
    while (true) {
        if (showWindow) ns.clearLog();
        printBotInfo(ns);

        if (getShouldBuyOrUpgrade(ns)) {
            buyOrUpgradeBots(ns);
        }
        
        await ns.sleep(100);
    }
}

/** @param {import(".").NS } ns */
function buyOrUpgradeBots(ns) {
    const bots = ns.getPurchasedServers().map(server => ns.getServer(server));
    if (bots.length === 0) {
        buyBot(ns, bots);
    } else {
        const botToUpgrade = getBotToUpgrade(ns, bots);
        if (botToUpgrade) {
            log(`upgrading ${botToUpgrade.hostname} for ${botToUpgrade.costToUpgrade}`);
            ns.upgradePurchasedServer(botToUpgrade.hostname, botToUpgrade.targetRam);
            lastServerAction = UPGRADE;
            lastServerName = botToUpgrade.hostname;
            lastServerPrice = botToUpgrade.costToUpgrade;
            lastServerTime = new Date();
        } else if (bots.length < MAX_BOTS){
            buyBot(ns, bots);
        }
    }
}

/** @param {import(".").NS } ns
 *  @param {Server[]} bots
 */
function buyBot(ns, bots) {
    const nextIndex = getNextIndex(bots);
    const nextBotName = `bot-${nextIndex}`;

    const money = ns.getPlayer().money;
    const cost = ns.getPurchasedServerCost(2);

    if (money >= cost) {
        log(`buying ${nextBotName}`);
        ns.purchaseServer(nextBotName, 2);
        lastServerAction = BUY;
        lastServerName = nextBotName;
        lastServerPrice = cost;
        lastServerTime = new Date();
    } else {
        log('cannot buy bot at this time');
    }
}

/** @param {import(".").NS } ns
 *  @param {Server[]} bots
 */
function getBotToUpgrade(ns, bots) {
    const mapped = bots.map(bot => {
        return {
            hostname: bot.hostname,
            costToUpgrade: ns.getPurchasedServerUpgradeCost(bot.hostname, bot.maxRam * 2),
            targetRam: bot.maxRam * 2
        };
    })
    .filter(bot => {
        const money = ns.getPlayer().money;
        return money >= bot.costToUpgrade;
    });

    if (mapped.length === 0) {
        return null;
    }

    return mapped.sort((bot1, bot2) => bot1.costToUpgrade - bot2.costToUpgrade)[0];
}

/** @param {import(".").NS } ns
 *  @param {Server[]} bots
 */
function getNextIndex(bots) {
    if (bots.length === 0) {
        return 1;
    }
    const botNames = bots.map(bot => bot.hostname);
    const indices = botNames.map(botName => {
        const parts = botName.split('-');
        return parseInt(parts[1]);
    });
    return indices.sort((a, b) => b - a)[0] + 1;
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
        ns.writePort(PORT_MAPPING.HAS_MAX_BOTS, 1);
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

function log(...args) {
    utilLog('bots', ...args);
}