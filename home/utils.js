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

export const PORT_MAPPING = {
    'DO_BUY': 1,
    'DO_STONKS': 2,
    'DO_GANG': 3,
    'HAS_MAX_BOTS': 21,
    'GANG_UPGRADE_CYCLES': 31,
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

/** @param {import(".").NS } ns */
export function getTimesToUpgradeGangMembers(ns) {
    const cycles = ns.peek(PORT_MAPPING.GANG_UPGRADE_CYCLES);
    return getCycles(cycles);
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