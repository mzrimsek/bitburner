import { getFormattedTime, getShouldBuyOrUpgrade, PORT_MAPPING, getDocument, HACKNET_UPGRADE_TYPES } from 'utils.js';
import { HacknetService } from 'services/hacknet.js';


let lastAction = '';
let lastType = '';
let lastNode = '';
let lastCost = 0;
let lastTime = new Date();
let lastLogMessage = '';

/** @param {import(".").NS } ns */
export async function main(ns) {
    await handleHacknet(ns, true);
}

/** @param {import(".").NS } ns */
export async function handleHacknet(ns, showWindow = false, width = 500, height = 80, xWidthOffset = 835, yPos = 880) {
    const logsToDisable = [
        'sleep',
    ]
    logsToDisable.forEach(l => ns.disableLog(l))

    ns.atExit(() => {
        ns.closeTail(ns.pid);
    });

    if (showWindow) {
        ns.tail()

        await ns.sleep(100);

        ns.resizeTail(width, height);
        ns.moveTail(getDocument().body.clientWidth - xWidthOffset, yPos);
    }

    const hacknetService = new HacknetService(ns);
    while (true) {
        if (showWindow) ns.clearLog();
        printHacknetInfo(ns, hacknetService);

        if (getShouldBuyOrUpgrade(ns)) {
            hacknetService.purchaseUpgradeOrNode((currentAction) => {
                lastAction = currentAction.action;
                lastType = currentAction.type;
                lastNode = currentAction.name;
                lastCost = currentAction.cost;
                lastTime = currentAction.time || new Date();
            });
        }

        await ns.sleep(100);
    }
}

/** @param {import(".").NS } ns
 */
function printHacknetInfo(ns, hacknetService) {
    const hacknetIncome = hacknetService.getHacknetIncome();

    ns.print(`${numHackNetNodes} hacknet nodes producing $${hacknetIncome}/sec\n\n`);

    if (lastAction && lastNode && lastCost) {
        const message = `[${getFormattedTime(lastTime)}] ($${ns.formatNumber(lastCost)}) ${getActionMessage(lastAction)} ${lastNode}`;
        if (message !== lastLogMessage) {
            ns.writePort(PORT_MAPPING.LOG_FEED, message);
            lastLogMessage = message;
        }
    }
}

function getActionMessage(lastAction) {
    switch (lastType) {
        case HACKNET_UPGRADE_TYPES.BUY: {
            return 'BUY';
        }
        case HACKNET_UPGRADE_TYPES.LEVEL: {
            return 'LVL UP';
        }
        case HACKNET_UPGRADE_TYPES.RAM: {
            return 'RAM UP';
        }
        case HACKNET_UPGRADE_TYPES.CORES: {
            return 'CORE UP';
        }
        default: {
            return lastType;
        }
    }
}
