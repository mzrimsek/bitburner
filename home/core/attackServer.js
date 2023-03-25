import { getFormattedTime, getDocument, logAttack, getFormattedDuration, ACTIONS } from 'utils.js';
import { AttackService } from 'services/attack.js';

/** @param {import("..").NS } ns */
export async function main(ns) {
    const openWindow = !ns.args.includes('--no-open');
    await handleAttackServer(ns, openWindow);
}

/** @param {import("..").NS } ns */
export async function handleAttackServer(ns, showWindow = false, width = 500, height = 180, xWidthOffset = 835, yPos = 685) {

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

    const attackService = new AttackService(ns);

    while (true) {
        if (showWindow) ns.clearLog();

        await attackService.initiateAttack(scriptEvent => {
            printServerDetails(ns, scriptEvent.name, scriptEvent.threshold, scriptEvent.amount, scriptEvent.action, scriptEvent.attackers);
            logAttack(ns, scriptEvent);
        });
    }
}

/** @param {import("..").NS } ns
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

    if (hackType == ACTIONS.HACK) {
        workTime = ns.getHackTime(host);
        workType = "HACKING";
    } else if (hackType == ACTIONS.GROW) {
        workTime = ns.getGrowTime(host);
        workType = "GROWING";
    } else if (hackType == ACTIONS.WEAKEN) {
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
