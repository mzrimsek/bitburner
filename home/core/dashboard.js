import { logCustomScriptEvent } from 'utils.js';
import { BotService } from 'services/bots.js';
import { EnvService } from 'services/env.js';
import { HacknetService } from 'services/hacknet.js';
import { GangService } from 'services/gangs.js';
import { SleeveService } from 'services/sleeves.js';
import { CorpService } from 'services/corp.js';

/** @param {import("..").NS } ns */
export async function main(ns) {
  const envService = new EnvService(ns);
  const botService = new BotService(ns);
  const hacknetService = new HacknetService(ns);
  const gangService = new GangService(ns);
  const sleeveService = new SleeveService(ns);
  const corpService = new CorpService(ns);

  const eventHandler = scriptEvent => logCustomScriptEvent(ns, scriptEvent);

  while (true) {
    if (envService.getDoBuy()) {
      hacknetService.purchaseUpgradeOrNode(eventHandler);
    }

    if (envService.getDoBuy()) {
      botService.buyOrUpgradeBots(eventHandler);
    }

    if (gangService.hasGang() && envService.getDoGang()) {
      gangService.handleGang(eventHandler);
    }

    if (sleeveService.hasSleeves()) {
      sleeveService.handleSleeves(eventHandler);
    }

    if (corpService.hasCorp()) {
      corpService.handleCorporation(eventHandler);
    }

    await ns.sleep(100);
  }
}
