import { log as utilLog, ACTIONS, logEventHandler } from 'utils.js';

export class BotService {
  /**
   * @param {import("..").NS } ns
   * @param {import("..").ScriptHandler} eventHandler
   */
  constructor(ns, eventHandler = logEventHandler) {
    this.ns = ns;
    this.eventHandler = eventHandler;
  }

  buyOrUpgradeBots() {
    const maxBots = this.ns.getPurchasedServerLimit();
    const bots = this.ns.getPurchasedServers().map(server => this.ns.getServer(server));
    if (bots.length === 0) {
      this.#buyBot(bots);
    } else {
      const botToUpgrade = this.#getBotToUpgrade(bots);
      if (botToUpgrade) {
        this.#log(`upgrading ${botToUpgrade.hostname} for ${botToUpgrade.costToUpgrade}`);
        this.ns.upgradePurchasedServer(botToUpgrade.hostname, botToUpgrade.targetRam);
        const currentAction = {
          action: ACTIONS.UPGRADE,
          name: botToUpgrade.hostname,
          cost: botToUpgrade.costToUpgrade,
          type: 'ram'
        };
        this.eventHandler(currentAction);
      } else if (bots.length < maxBots) {
        this.#buyBot(bots);
      }
    }
  }

  canBuyBots() {
    return this.ns.getPurchasedServerLimit() !== 0;
  }

  /**
   *  @param {import("..").Server[]} bots
   */
  #buyBot(bots) {
    const nextIndex = this.#getNextIndex(bots);
    const nextBotName = `bot-${nextIndex}`;

    const money = this.ns.getPlayer().money;
    const cost = this.ns.getPurchasedServerCost(2);

    if (money >= cost) {
      this.#log(`buying ${nextBotName}`);
      this.ns.purchaseServer(nextBotName, 2);
      const currentAction = {
        action: ACTIONS.BUY,
        name: nextBotName,
        cost: cost
      };
      this.eventHandler(currentAction);
    } else {
      this.#log('cannot buy bot at this time');
    }
  }

  /**
   *  @param {import("..").Server[]} bots
   */
  #getBotToUpgrade(bots) {
    const mapped = bots
      .map(bot => {
        return {
          hostname: bot.hostname,
          costToUpgrade: this.ns.getPurchasedServerUpgradeCost(bot.hostname, bot.maxRam * 2),
          targetRam: bot.maxRam * 2
        };
      })
      .filter(bot => {
        const money = this.ns.getPlayer().money;
        return money >= bot.costToUpgrade;
      });

    if (mapped.length === 0) {
      return null;
    }

    return mapped.sort((bot1, bot2) => bot1.costToUpgrade - bot2.costToUpgrade)[0];
  }

  /**
   *  @param {import("..").Server[]} bots
   */
  #getNextIndex(bots) {
    if (bots.length === 0) {
      return 1;
    }
    const botNames = bots.map(bot => bot.hostname);
    const indices = botNames.map(botName => {
      const parts = botName.split('-');
      return parseInt(parts[1]);
    });
    return indices.sort((a, b) => b - a)[0] + 1;
  }

  #log(...args) {
    utilLog('bots', ...args);
  }
}
