export function log(tag, ...args) {
    console.log(`[${tag}] `, ...args);
}

export const STARTUP_SCRIPTS = [
    'attackServer.js',
    'hacknet.js',
    'bots.js',
    'hud.js',
    'infiltration.js',
    'stonks.js',
    'showEnv.js',
    'log.js'
];

export const PORT_MAPPING = {
    'DO_BUY': 1,
    'DO_STONKS': 2,
    'LOG_FEED': 100
};

export function padString(str, targetLength, padStr = ' ') {
    let strCopy = str;

    while(true) {
        if(strCopy.length >= targetLength) {
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

export function getDocument() {
    return eval(`document`);
}