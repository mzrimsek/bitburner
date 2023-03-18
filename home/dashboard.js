import { PORT_MAPPING, getFormattedTime, getShouldBuyOrUpgrade, getShouldDoGang } from 'utils.js';
import { BotService } from 'services/bots.js';
import { HacknetService } from 'services/hacknet.js';
import { GangService } from 'services/gangs.js';
import { AttackService } from 'services/attack.js';

let lastLogMessage = "";

/** @param {import(".").NS } ns */
export async function main(ns) {
  const botService = new BotService(ns);
  const hacknetService = new HacknetService(ns);
  const gangService = new GangService(ns);
  const attackService = new AttackService(ns);

  while (true) {
    if (getShouldBuyOrUpgrade(ns)) {
      botService.buyOrUpgradeBots(scriptEvent => log(ns, scriptEvent));
      hacknetService.purchaseUpgradeOrNode(scriptEvent => log(ns, scriptEvent));
    }

    if (getShouldDoGang(ns)) {
      gangService.handleGang(scriptEvent => log(ns, scriptEvent));
    }

    await attackService.initiateAttack(scriptEvent => log(ns, scriptEvent));

    await ns.sleep(100);
  }
}

/** 
 * @param {import(".").NS } ns
 * @param {import(".").ScriptEvent } scriptEvent */
function log(ns, scriptEvent) {
  const time = scriptEvent?.time || new Date();
  const cost = scriptEvent?.cost || 0;
  const message = `[${getFormattedTime(time)}] ($${ns.formatNumber(cost)}) ${scriptEvent.action} ${scriptEvent.name}`;
  if (message !== lastLogMessage) {
    ns.writePort(PORT_MAPPING.LOG_FEED, message);
    lastLogMessage = message;
  }
}