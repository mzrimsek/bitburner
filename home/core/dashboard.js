import { logCustomScriptEvent } from 'utils.js';
import { BotService } from 'services/bots.js';
import { EnvService } from 'services/env.js';
import { HacknetService } from 'services/hacknet.js';
import { GangService } from 'services/gangs.js';
import { SleeveService } from 'services/sleeves.js';
import { CorpService } from 'services/corp.js';

/** @param {import("..").NS } ns */
export async function main(ns) {
  const eventHandler = scriptEvent => logCustomScriptEvent(ns, scriptEvent);

  const envService = new EnvService(ns, eventHandler);
  const botService = new BotService(ns, eventHandler);
  const hacknetService = new HacknetService(ns, eventHandler);
  const gangService = new GangService(ns, eventHandler);
  const sleeveService = new SleeveService(ns, eventHandler);
  const corpService = new CorpService(ns, eventHandler);

  while (true) {
    if (envService.getDoBuy()) {
      hacknetService.purchaseUpgradeOrNode();
    }

    if (hacknetService.isHacknetServers()) {
      hacknetService.spendHashes();
    }

    if (envService.getDoBuy() && botService.canBuyBots()) {
      botService.buyOrUpgradeBots();
    }

    if (gangService.hasGang() && envService.getDoGang()) {
      gangService.handleGang();
    }

    if (sleeveService.hasSleeves()) {
      sleeveService.handleSleeves();
    }

    if (corpService.hasCorp()) {
      corpService.handleCorporation();
    }

    await ns.sleep(100);
  }
}
