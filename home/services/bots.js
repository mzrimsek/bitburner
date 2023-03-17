import { log as utilLog } from 'utils.js';

export class BotService {
  /** @param {import("..").NS } ns */
  constructor(ns) {
    this.ns = ns;
  }

  buyOrUpgradeBots() {
    const bots = this.ns.getPurchasedServers().map(server => this.ns.getServer(server));
    if (bots.length === 0) {
      this._buyBot(bots);
    } else {
      const botToUpgrade = this._getBotToUpgrade(bots);
      if (botToUpgrade) {
        this._log(`upgrading ${botToUpgrade.hostname} for ${botToUpgrade.costToUpgrade}`);
        this.ns.upgradePurchasedServer(botToUpgrade.hostname, botToUpgrade.targetRam);
        lastServerAction = UPGRADE;
        lastServerName = botToUpgrade.hostname;
        lastServerPrice = botToUpgrade.costToUpgrade;
        lastServerTime = new Date();
      } else if (bots.length < MAX_BOTS) {
        this._buyBot(bots);
      }
    }
  }

  /**
   *  @param {import("..").Server[]} bots
   */
  _buyBot(bots) {
    const nextIndex = this._getNextIndex(bots);
    const nextBotName = `bot-${nextIndex}`;

    const money = this.ns.getPlayer().money;
    const cost = this.ns.getPurchasedServerCost(2);

    if (money >= cost) {
      this._log(`buying ${nextBotName}`);
      this.ns.purchaseServer(nextBotName, 2);
      lastServerAction = BUY;
      lastServerName = nextBotName;
      lastServerPrice = cost;
      lastServerTime = new Date();
    } else {
      this._log('cannot buy bot at this time');
    }
  }

  /**
   *  @param {import("..").Server[]} bots
   */
  _getBotToUpgrade(bots) {
    const mapped = bots.map(bot => {
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
  _getNextIndex(bots) {
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

  _log(...args) {
    utilLog('bots', ...args);
  }
}