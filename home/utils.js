export function log(tag, ...args) {
    console.log(`[${tag}] `, ...args);
}

export const STARTUP_SCRIPTS = [
    'dashboard.js',
    'attackServer.js',
    'hud.js',
    'infiltration.js',
    'stonks.js',
    'showEnv.js',
    'log.js'
];

export const DEFAULT_PORT_VALUE = 'NULL PORT DATA';

export const PORT_MAPPING = {
    'DO_BUY': 1,
    'DO_STONKS': 2,
    'DO_GANG': 3,
    'HAS_MAX_BOTS': 21,
    'LOG_FEED': 100,
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

let lastLogMessage = "";

/** 
 * @param {import(".").NS } ns
 * @param {import(".").ScriptEvent } scriptEvent */
export function logPurchase(ns, scriptEvent) {
    const time = scriptEvent?.time || new Date();
    const cost = scriptEvent?.cost || 0;
    const message = `[${getFormattedTime(time)}] ($${ns.formatNumber(cost)}) ${scriptEvent.action} ${scriptEvent.name}`;
    if (message !== lastLogMessage) {
        ns.writePort(PORT_MAPPING.LOG_FEED, message);
        lastLogMessage = message;
    }
}

/** 
 * @param {import(".").NS } ns
 * @param {import(".").ScriptAttackEvent } scriptEvent */
export function logAttack(ns, scriptEvent) {
    const time = scriptEvent?.time || new Date();
    const message = `[${getFormattedTime(time)}] ${scriptEvent.action} ${scriptEvent.name} from ${scriptEvent.attackers}`;
    if (message !== lastLogMessage) {
        ns.writePort(PORT_MAPPING.LOG_FEED, message);
        lastLogMessage = message;
    }
}
