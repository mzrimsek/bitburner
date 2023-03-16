import { log as utilLog, STARTUP_SCRIPTS, getFormattedTime, getDocument } from 'utils.js';

const hackSource = 'home';
const excludedServers = [hackSource];
const hackFile = '/basic/hack.js';
const weakenFile = '/basic/weaken.js';
const growFile = '/basic/grow.js';

/** @param {import(".").NS } ns */
export async function main(ns) {
    await handleAttackServer(ns, true);
}

/** @param {import(".").NS } ns */
export async function handleAttackServer(ns, showWindow = false, width = 500, height = 180, xWidthOffset = 835, yPos = 685) {
    const children = getChildren(ns, hackSource);
    const serverNames = getServerNames(ns, hackSource, children).filter(serverName => !excludedServers.includes(serverName));

    const logsToDisable = [
        'sleep',
        'exec',
        'killall',
        'scan',
        'scp',
        'nuke',
        'httpworm',
        'relaysmtp',
        'sqlinject',
        'getHackingLevel',
        'getServerRequiredHackingLevel',
        'getServerMoneyAvailable',
        'getServerMaxMoney',
        'getServerMaxRam',
        'getServerUsedRam',
        'getServerSecurityLevel',
        'getServerMinSecurityLevel'
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

    while (true) {
        ns.clearLog()
        
        await openServers(ns, serverNames);
        const hackableServerNames = await getHackableServerNames(ns, serverNames);
        const ownedServerNames = await getOwnedServerNames(ns);
        const allServerNamesToAttackFrom = [...hackableServerNames, ...ownedServerNames];
        await coordinateAttack(ns, allServerNamesToAttackFrom);
    }
}

/** @param {import(".").NS } ns
 *  @param {string[]} hackableServerNames
 */
async function coordinateAttack(ns, hackableServerNames) {
    const target = getTargetServer(ns, hackableServerNames);
    log(`${target} identified`);

    const moneyThreshhold = ns.getServerMaxMoney(target) * .9;
    const securityThreshhold = ns.getServerMinSecurityLevel(target) + 5;

    const numTimesToHack = 2.05;

    const securityLevel = ns.getServerSecurityLevel(target);
    const availableMoney = ns.getServerMoneyAvailable(target);
    if (securityLevel > securityThreshhold) {
        log(`${target} weakening`);
        for(const serverName of hackableServerNames) {
            killScripts(ns, serverName);
            const freeRam = getFreeRam(ns, serverName);
            const ramToWeaken = ns.getScriptRam(weakenFile, hackSource);
            const numThreads = Math.floor(freeRam/ramToWeaken);
            if (numThreads > 0) {
                if (!ns.fileExists(weakenFile, serverName)) {
                    ns.scp(weakenFile, serverName, hackSource);
                }
                ns.exec(weakenFile, serverName, numThreads, target);
            }
        }
        await printServerDetails(ns, target, securityThreshhold, numTimesToHack, 'weaken', hackableServerNames.length);
        await ns.sleep(numTimesToHack * ns.getWeakenTime(target) + 300);
    } else if (availableMoney < moneyThreshhold) {
        log(`${target} growing`);
        for(const serverName of hackableServerNames) {
            killScripts(ns, serverName);
            const freeRam = getFreeRam(ns, serverName);
            const ramToGrow = ns.getScriptRam(growFile, hackSource);
            const numThreads = Math.floor(freeRam/ramToGrow);
            if (numThreads > 0) {
                if (!ns.fileExists(growFile, serverName)) {
                    ns.scp(growFile, serverName, hackSource);
                }
                ns.exec(growFile, serverName, numThreads, target);
            }
        }
        await printServerDetails(ns, target, securityThreshhold, numTimesToHack, 'grow', hackableServerNames.length);
        await ns.sleep(numTimesToHack * ns.getGrowTime(target) + 300);
    } else {
        log(`${target} hacking`);
        for(const serverName of hackableServerNames) {
            killScripts(ns, serverName);
            const freeRam = getFreeRam(ns, serverName);
            const ramToHack = ns.getScriptRam(hackFile, hackSource);
            const numThreads = Math.floor(freeRam/ramToHack);
            if (numThreads > 0) {
                if (!ns.fileExists(hackFile, serverName)) {
                    ns.scp(hackFile, serverName, hackSource);
                }
                ns.exec(hackFile, serverName, numThreads, target);
            }
        }
        await printServerDetails(ns, target, securityThreshhold, numTimesToHack, 'hack', hackableServerNames.length);
        await ns.sleep(numTimesToHack * ns.getHackTime(target) + 300);
    }
}

/** @param {import(".").NS } ns
 *  @param {string[]} hackableServernames
 */
function getTargetServer(ns, hackableServernames) {
    let target = 'n00dles';
    let optimalVal = 0;
    let currVal;
    let currTime;

    for(const serverName of hackableServernames) {
        currVal = ns.getServerMaxMoney(serverName);
        currTime = ns.getWeakenTime(serverName) + ns.getGrowTime(serverName) + ns.getHackTime(serverName);
        currVal /= currTime;
        if (currVal >= optimalVal) {
            optimalVal = currVal;
            target = serverName;
        }
    }

    return target;
}

/** @param {import(".").NS } ns
 *  @param {string[]} serverNames
 */
async function getHackableServerNames(ns, allServerNames) {
    const servers = await getServers(ns, allServerNames);
    const hackableServerNames = servers.filter(server => {
        const hackingLevel = ns.getHackingLevel();
        const requiredHackingLevel = ns.getServerRequiredHackingLevel(server.hostname);
        return server.hasAdminRights && requiredHackingLevel <= hackingLevel && server.numOpenPortsRequired <= server.openPortCount;
    }).map(server => server.hostname);
    const allNames = [hackSource, ...hackableServerNames];
    return [...new Set(allNames)];
}

/** @param {import(".").NS } ns
 */
async function getOwnedServerNames(ns) {
    const local = ns.scan(hackSource);
    const servers = await getServers(ns, local);
    return servers.filter(server => server.purchasedByPlayer).map(server => server.hostname);
}

/** @param {import(".").NS } ns
 *  @param {string[]} serverNames
 */
async function openServers(ns, serverNames) {
    log('opening servers...');
    const servers = await getServers(ns, serverNames);
    servers.forEach(async (server) => await openServer(ns, server));
}

/** @param {import(".").NS } ns
 *  @param {Server} server
 */
async function openServer(ns, server) {
    const hasSshHack = ns.fileExists('BruteSSH.exe', hackSource);
    if (!server.sshPortOpen && hasSshHack) {
        log(server.hostname, 'Opening SSH port');
        ns.brutessh(server.hostname);
    }

    const hasFtpHack = ns.fileExists('FTPCrack.exe', hackSource);
    if (!server.ftpPortOpen && hasFtpHack) {
        log(server.hostname, 'Opening FTP port');
        ns.ftpcrack(server.hostname);
    }

    const hasSmtpHack = ns.fileExists('relaySMTP.exe', hackSource);
    if (!server.smtpPortOpen && hasSmtpHack) {
        log(server.hostname, 'Opening SMTP port');
        ns.relaysmtp(server.hostname);
    }

    const hasHttpHack = ns.fileExists('HTTPWorm.exe', hackSource);
    if (!server.httpPortOpen && hasHttpHack) {
        log(server.hostname, 'Opening HTTP port');
        ns.httpworm(server.hostname);
    }

    const hasSqlHack = ns.fileExists('SQLInject.exe', hackSource);
    if (!server.sqlPortOpen && hasSqlHack) {
        log(server.hostname, 'Opening SQL port');
        ns.sqlinject(server.hostname);
    }

    // get admin access
    const hasNukeHack = ns.fileExists('NUKE.exe', hackSource);
    if (!server.hasAdminRights && hasNukeHack && server.numOpenPortsRequired <= server.openPortCount) {
        log(server.hostname, 'Getting root access');
        ns.nuke(server.hostname);
    }

    // install backdoor
    if (server.hasAdminRights && !server.backdoorInstalled) {
        // install backdoor later
    }
}

/** @param {import(".").NS } ns
 *  @param {string} host
 *  @param {string} parent
 *  @param {string[]} list
 */
function getServerNames(ns, host, children, list = []) {
    children.forEach(child => {
        const nextChildren = getChildren(ns, child, host);
        getServerNames(ns, child, nextChildren, list);
    });

    list.push(host);
    return list;
}

/** @param {import(".").NS } ns
 *  @param {string} host
 *  @param {string} parent
 */
function getChildren(ns, host, parent) {
    return ns.scan(host).filter(child => {
        const isExcluded = excludedServers.includes(child);
        const isParent = parent && child === parent;
        return !isExcluded && !isParent;
    })
}

/** @param {import(".").NS } ns
 *  @param {string[]} serverNames
 */
async function getServers(ns, serverNames) {
    return serverNames.map(serverName => ns.getServer(serverName));
}

/** @param {import(".").NS } ns
 *  @param {string} serverName
 */
function getFreeRam(ns, serverName) {
    return serverName === hackSource ? getHackSourceFreeRam(ns) : getServerFreeRam(ns, serverName);
}

/** @param {import(".").NS } ns
 *  @param {string} serverName
 */
function getServerFreeRam(ns, serverName) {
    return ns.getServerMaxRam(serverName) - ns.getServerUsedRam(serverName);
}

/** @param {import(".").NS } ns
 */
function getHackSourceFreeRam(ns) {
    const freeRam = getServerFreeRam(ns, hackSource);
    const specialRam = STARTUP_SCRIPTS.reduce((totalRam, script) => {
        const cost = ns.getScriptRam(script, hackSource);
        return totalRam + cost;
    }, 0);
    return freeRam - specialRam;
}

/** @param {import(".").NS } ns
 *  @param {string} serverName
 */
function killScripts(ns, serverName) {
    if (serverName !== hackSource) {
        ns.killall(serverName, true);
    } else {
        const runningScripts = ns.ps(serverName).map(process => process.filename);
        const scriptsToKill = runningScripts.filter(script => !STARTUP_SCRIPTS.includes(script));
        for(const scriptToKill of scriptsToKill) {
            ns.scriptKill(scriptToKill, serverName);
        }
    }
}

/** @param {import(".").NS } ns
 *  @param {string} host
 *  @param {number} securityThresh
 *  @param {number} numTimesToHack
 *  @param {string} hackType
 */
async function printServerDetails(ns, host, securityThresh, numTimesToHack, hackType, numHackers) {
    const moneyCurrent = Math.floor(ns.getServerMoneyAvailable(host));
    const moneyMax = Math.floor(ns.getServerMaxMoney(host));
    const moneyPerc = Math.floor((moneyCurrent / moneyMax * 100));
 
    const newCur = ns.formatNumber(moneyCurrent);
    const newMax = ns.formatNumber(moneyMax);
 
    const servSec = Math.floor(ns.getServerSecurityLevel(host));
    const servMaxSec = Math.floor(ns.getServerMinSecurityLevel(host));
 
    let workTime = 0;
    let workType = "NONE";
 
    if (hackType == "hack") {
        workTime = ns.getHackTime(host);
        workType = "HACKING";
    } else if (hackType == "grow") {
        workTime = ns.getGrowTime(host);
        workType = "GROWING";
    } else if (hackType == "weaken") {
        workTime = ns.getWeakenTime(host);
        workType = "WEAKENING";
    } else {
        ns.print("Incorrect hackType in getServerDetails. Only hack, grow, and weaken are allowed. Ending script.");
        return;
    }

    ns.print(`${workType} ${host} from ${numHackers} attackers\n\n`);
    
    ns.print(`Security: ${servSec} [Min: ${servMaxSec}, Thresh: ${securityThresh}]`);
    ns.print(`Money: ${newCur} of ${newMax} (${moneyPerc}%)\n\n`);

    const estimatedTimeMS = numTimesToHack * workTime + 300;
    const estimatedTimeS = Math.floor(estimatedTimeMS / 1000);

    const nextExecutionTime = new Date().getTime() + estimatedTimeMS;
    const nextExcutionDate = new Date(nextExecutionTime);
    
    ns.print(`Next action at ${getFormattedTime(nextExcutionDate)} after ${getFormattedDuration(estimatedTimeS)}`);
    return;
}

/** @param {number} baseTimeS
 */
function getFormattedDuration(baseTimeS) {
    if (baseTimeS >= 60) { // 
        const mins = Math.floor(baseTimeS / 60);
        const secs = baseTimeS - (mins * 60);
        return `${mins}min ${secs}s`;
    }

    return `${baseTimeS}s`;
}

function log(...args) {
    utilLog('hack', ...args);
}