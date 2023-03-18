import { getShouldBuyOrUpgrade, getShouldDoGang, logPurchase } from 'utils.js';
import { BotService } from 'services/bots.js';
import { HacknetService } from 'services/hacknet.js';
import { GangService } from 'services/gangs.js';


/** @param {import(".").NS } ns */
export async function main(ns) {
  const botService = new BotService(ns);
  const hacknetService = new HacknetService(ns);
  const gangService = new GangService(ns);

  while (true) {
    if (getShouldBuyOrUpgrade(ns)) {
      botService.buyOrUpgradeBots(scriptEvent => logPurchase(ns, scriptEvent));
      hacknetService.purchaseUpgradeOrNode(scriptEvent => logPurchase(ns, scriptEvent));
    }

    if (getShouldDoGang(ns)) {
      gangService.handleGang(scriptEvent => logPurchase(ns, scriptEvent));
    }

    await ns.sleep(100);
  }
}
