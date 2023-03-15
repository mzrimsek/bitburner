import { log as utilLog, getFormattedTime, getShouldBuyOrUpgrade, PORT_MAPPING, getDocument } from 'utils.js';

// TODO make this factor in not only which is cheaper but which upgrade gives the most increase in money

const maxLevel = 200;
const maxRam = 64;
const maxCores = 16;

let lastAction = '';
let lastNode = '';
let lastCost = 0;
let lastTime = new Date();
let lastLogMessage = '';

/** @param {import(".").NS } ns */
export async function main(ns) {
    const logsToDisable = [
        'sleep',
    ]
    logsToDisable.forEach(l => ns.disableLog(l))

    const sleepTime = ns.args[0] || 100;

    ns.atExit(() => {
        ns.closeTail(ns.pid);
    });

    ns.tail()

    await ns.sleep(100);    

    ns.resizeTail(500, 80);
    ns.moveTail(getDocument().body.clientWidth - 835, 880);

    while(true) {
        ns.clearLog();
        printInfo(ns);

        if (getShouldBuyOrUpgrade(ns)) {
            purchaseUpgradeOrNode(ns);
        }

        await ns.sleep(sleepTime);
    }
}

/** @param {import(".").NS } ns */
function purchaseUpgradeOrNode(ns) {
    const next = getNextUpgrade(ns);
    if (!next) {
        const nodeCost = ns.hacknet.getPurchaseNodeCost();
        const currentMoney = ns.getPlayer().money;

        if (nodeCost <= currentMoney) {
            log(`Buying new node for ${nodeCost}`);
            const newIndex = ns.hacknet.purchaseNode();
            const newStats = ns.hacknet.getNodeStats(newIndex);
            lastAction = 'buy';
            lastNode = newStats.name;
            lastCost = nodeCost;
            lastTime = new Date();
        }
    } else {
        log(`(${next.name}) Upgrading ${next.upgrade}`);
        const success = processUpgrade(ns, next);
        if (success) {
            lastAction = next.upgrade;
            lastNode = next.name;
            lastCost = next.cost;
            lastTime = new Date();
            log(`(${next.name}) Successfully upgraded ${next.upgrade}`);
        } else {
            log(`(${next.name}) Failed to upgrade ${next.upgrade}`);
        }
    }
}

/** @param {import(".").NS } ns */
function getNextUpgrade(ns) {
    const nodeCount = ns.hacknet.numNodes();
    const nodes = [...new Array(nodeCount)].map((_, index) => {
        const nodeInfo = ns.hacknet.getNodeStats(index);
        const level = {
            current: nodeInfo.level,
            upgradeCost: ns.hacknet.getLevelUpgradeCost(index, 1)
        };
        const ram = {
            current: nodeInfo.ram,
            upgradeCost: ns.hacknet.getRamUpgradeCost(index, 1)
        };
        const cores = {
            current: nodeInfo.cores,
            upgradeCost: ns.hacknet.getCoreUpgradeCost(index, 1)
        };

        return {
            ...nodeInfo,
            level: level,
            ram: ram,
            cores: cores,
            index
        };
    });

    const currentMoney = ns.getPlayer().money;
    const potentialUpgrades = nodes.reduce((items, node) => {
        if (node.level.current < maxLevel) {
            if (node.level.upgradeCost <= currentMoney) {
                items = [...items, {
                    upgrade: 'level',
                    index: node.index,
                    cost: node.level.upgradeCost,
                    name: node.name
                }];
            }
        }

        if (node.ram.current < maxRam) {
            if (node.ram.upgradeCost <= currentMoney) {
                items = [...items, {
                    upgrade: 'ram',
                    index: node.index,
                    cost: node.ram.upgradeCost,
                    name: node.name
                }];
            }
        }

        if (node.cores.current < maxCores) {
            if (node.cores.upgradeCost <= currentMoney) {
                items = [...items, {
                    upgrade: 'cores',
                    index: node.index,
                    cost: node.cores.upgradeCost,
                    name: node.name
                }];
            }
        }

        return items;
    }, []);

    if (potentialUpgrades.length === 0) {
        return null;
    }

    log(`Found ${potentialUpgrades.length} potential upgrades`);
    const sortedPotentialUpgrades = potentialUpgrades.sort((a, b) => a.cost - b.cost);

    return sortedPotentialUpgrades[0];
}

function processUpgrade(ns, next) {
    switch (next.upgrade) {
        case 'level': {
            return ns.hacknet.upgradeLevel(next.index, 1);
        }
        case 'ram': {
            return ns.hacknet.upgradeRam(next.index, 1);
        }
        case 'cores': {
            return ns.hacknet.upgradeCore(next.index, 1);
        }
        default: {
            return false;
        }
    }
}

/** @param {NS} ns
 */
function printInfo(ns) {
    const numHackNetNodes = ns.hacknet.numNodes();
    let hacknetProductionRaw = 0;
    for(let i = 0; i < numHackNetNodes; i++) {
        const node = ns.hacknet.getNodeStats(i);
        hacknetProductionRaw += node.production;
    }
    const hacknetIncome = ns.formatNumber(hacknetProductionRaw, 2);

    ns.print(`${numHackNetNodes} nodes producing $${hacknetIncome}/sec\n\n`);

    if (lastAction && lastNode && lastCost) {
        const message = `[${getFormattedTime(lastTime)}] ($${ns.formatNumber(lastCost)}) ${getActionMessage(lastAction)} ${lastNode}`;
        if (message !== lastLogMessage) {
            ns.writePort(PORT_MAPPING.LOG_FEED, message);
            lastLogMessage = message;
        }
    }
}

function getActionMessage(lastAction) {
    switch(lastAction) {
        case 'buy': {
            return 'BUY';
        }
        case 'level': {
            return 'LVL UP';
        }
        case 'ram': {
            return 'RAM UP';
        }
        case 'cores': {
            return 'CORE UP';
        }
        default: {
            return lastAction;
        }
    }
}

function log(...args) {
    utilLog('hacknet', ...args);
}