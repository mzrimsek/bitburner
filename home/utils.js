export function log(tag, ...args) {
    console.log(`[${tag}] `, ...args);
}

export const STARTUP_SCRIPTS = [
    'dashboard.js',
    'attackServer.js',
    'infiltration.js',
    'stonks.js',
    '/monitoring/hud.js',
    '/monitoring/log.js',
    '/monitoring/showEnv.js'
];

export const DEFAULT_PORT_VALUE = 'NULL PORT DATA';

export const PORT_MAPPING = {
    'DO_BUY': 1,
    'DO_STONKS': 2,
    'DO_GANG': 3,
    'HAS_ALL_MAXED_BOTS': 21,
    'LOG_FEED': 100,
};

export const ACTIONS = {
    'BUY': '💰',
    'UPGRADE': '🔩',
    'HACK': '🔓',
    'WEAKEN': '🔪',
    'GROW': '🌱',
    'ASCEND': '🚀',
};

export const HACKNET_UPGRADE_TYPES = {
    LEVEL: 'level',
    RAM: 'ram',
    CORES: 'cores',
    BUY: 'buy'
};

export function padString(str, targetLength, padStr = ' ') {
    let strCopy = str;

    while (true) {
        if (strCopy.length >= targetLength) {
            return strCopy;
        }
        strCopy = `${padStr}${strCopy}`;
    }
}

export function getFormattedTime(date) {
    const hours = date.getHours();
    const mins = date.getMinutes();
    const secs = date.getSeconds();

    return `${padTimePart(hours)}:${padTimePart(mins)}:${padTimePart(secs)}`;
}

/** @param {number} baseTimeS
 */
export function getFormattedDuration(baseTimeS) {
    if (baseTimeS >= 60) { // 
        const mins = Math.floor(baseTimeS / 60);
        const secs = baseTimeS - (mins * 60);
        return `${mins}min ${secs}s`;
    }

    return `${baseTimeS}s`;
}

/** @param {number} part
 */
function padTimePart(part) {
    return padString(`${part}`, 2, '0');
}

/** @param {import(".").NS } ns */
export function getShouldBuyOrUpgrade(ns) {
    return ns.peek(PORT_MAPPING.DO_BUY) === 1;
}

/** @param {import(".").NS } ns */
export function getShouldDoStonks(ns) {
    return ns.peek(PORT_MAPPING.DO_STONKS) === 1;
}

/** @param {import(".").NS } ns */
export function getShouldDoGang(ns) {
    return ns.peek(PORT_MAPPING.DO_GANG) === 1;
}

export function getDocument() {
    return eval(`document`);
}

export function initPort(ns, portNum, initValue) {
    ns.clearPort(portNum);
    ns.writePort(portNum, initValue);
}

export function getCycles(rawCycles) {
    const cyclesInt = parseInt(rawCycles);
    if (cyclesInt > 0) {
        return cyclesInt;
    }
    return 0;
}

let lastPurchaseMessage = "";
/** 
 * @param {import(".").NS } ns
 * @param {import(".").ScriptPurchaseEvent } scriptEvent */
export function logPurchase(ns, scriptEvent) {
    const time = scriptEvent?.time || new Date();
    const cost = scriptEvent?.cost || 0;
    const messageWithoutTime = `($${ns.formatNumber(cost)}) ${scriptEvent.action} ${scriptEvent.name}`;
    const message = `[${getFormattedTime(time)}] ${messageWithoutTime}`;
    if (messageWithoutTime !== lastPurchaseMessage) {
        ns.writePort(PORT_MAPPING.LOG_FEED, message);
        lastPurchaseMessage = messageWithoutTime;
    }
}

let lastUpgradeMessage = "";
/** 
 * @param {import(".").NS } ns
 * @param {import(".").ScriptUpgradeEvent } scriptEvent */
export function logUpgrade(ns, scriptEvent) {
    const time = scriptEvent?.time || new Date();
    const cost = scriptEvent?.cost || 0;
    const messageWithoutTime = `($${ns.formatNumber(cost)}) ${scriptEvent.action} ${scriptEvent.type} ${scriptEvent.name}`;
    const message = `[${getFormattedTime(time)}] ${messageWithoutTime}`;
    if (messageWithoutTime !== lastUpgradeMessage) {
        ns.writePort(PORT_MAPPING.LOG_FEED, message);
        lastUpgradeMessage = messageWithoutTime;
    }
}

let lastAttackMessage = "";
/** 
 * @param {import(".").NS } ns
 * @param {import(".").ScriptAttackEvent } scriptEvent */
export function logAttack(ns, scriptEvent) {
    const time = scriptEvent?.time || new Date();
    const messageWithoutTime = `${scriptEvent.action} ${scriptEvent.name} from ${scriptEvent.attackers} for ${getFormattedDuration(scriptEvent.duration)}`;
    const message = `[${getFormattedTime(time)}] ${messageWithoutTime}`;
    if (messageWithoutTime !== lastAttackMessage) {
        ns.writePort(PORT_MAPPING.LOG_FEED, message);
        lastAttackMessage = messageWithoutTime;
    }
}

let lastEventMessage = "";
/** 
 * @param {import(".").NS } ns
 * @param {import(".").ScriptEvent } scriptEvent */
export function logEvent(ns, scriptEvent) {
    const time = scriptEvent?.time || new Date();
    const messageWithoutTime = `${scriptEvent.action} ${scriptEvent.name}`;
    const message = `[${getFormattedTime(time)}] ${messageWithoutTime}`;
    if (messageWithoutTime !== lastEventMessage) {
        ns.writePort(PORT_MAPPING.LOG_FEED, message);
        lastEventMessage = messageWithoutTime;
    }
}
