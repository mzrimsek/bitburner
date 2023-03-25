import { getShouldBuyOrUpgrade, getShouldDoGang, logCustomScriptEvent } from 'utils.js';
import { BotService } from 'services/bots.js';
import { HacknetService } from 'services/hacknet.js';
import { GangService } from 'services/gangs.js';
import { SleeveService } from 'services/sleeves.js';


/** @param {import("..").NS } ns */
export async function main(ns) {
  const botService = new BotService(ns);
  const hacknetService = new HacknetService(ns);
  const gangService = new GangService(ns);
  const sleeveService = new SleeveService(ns);

  while (true) {
    if (getShouldBuyOrUpgrade(ns)) {
      botService.buyOrUpgradeBots(scriptEvent => logCustomScriptEvent(ns, scriptEvent));
      hacknetService.purchaseUpgradeOrNode(scriptEvent => logCustomScriptEvent(ns, scriptEvent));
    }

    if (ns.gang.inGang() && getShouldDoGang(ns)) {
      gangService.handleGang(scriptEvent => logCustomScriptEvent(ns, scriptEvent));
    }

    sleeveService.handleSleeves(scriptEvent => logCustomScriptEvent(ns, scriptEvent));

    await ns.sleep(100);
  }
}
