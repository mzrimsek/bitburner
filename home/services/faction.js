import { log as utilLog, logEventHandler } from 'utils.js';
import { EnvService } from 'services/env.js';

export class FactionService {
  /**
   * @param {import("..").NS } ns
   * @param {import("..").ScriptHandler} eventHandler
   */
  constructor(ns, eventHandler = logEventHandler) {
    this.ns = ns;
    this.sing = ns.singularity;

    this.eventHandler = eventHandler;

    this.envService = new EnvService(ns);
  }

  handleCurrentFactionAugments() {
    const purchasedAndInstalledAugmentations = this.sing.getOwnedAugmentations(true);
    const currentFactions = this.ns.getPlayer().factions;
    const currentJob = this.sing.getCurrentWork();

    const currentFactionAugmentations = currentFactions.reduce((acc, faction) => {
      const factionAugmentations = this.sing.getAugmentationsFromFaction(faction);
      return [...acc, ...factionAugmentations];
    }, []);

    const currentFactionAugmentationsToBuy = currentFactionAugmentations.filter(
      augmentName => !purchasedAndInstalledAugmentations.includes(augmentName)
    );

    const currentFactionAugmentationsToBuyWithDetails = currentFactionAugmentationsToBuy.map(
      augmentName => {
        const faction = currentFactions.find(faction =>
          this.sing.getAugmentationsFromFaction(faction).includes(augmentName)
        );
        const cost = this.sing.getAugmentationPrice(augmentName);
        const rep = this.sing.getAugmentationRepReq(augmentName);
        const weight = currentJob.type === 'FACTION' && currentJob.factionName === faction ? 2 : 1;
        return { augmentName, faction, cost, rep, weight };
      }
    );

    const currentMoney = this.ns.getPlayer().money;
    const afforableFactionAugmentationsToBuy = currentFactionAugmentationsToBuyWithDetails.filter(
      ({ cost, faction, rep }) => {
        const factionRep = this.sing.getFactionRep(faction);
        return currentMoney >= cost && factionRep >= rep;
      }
    );

    const sortedAfforableAugmentations = afforableFactionAugmentationsToBuy.sort(
      (a, b) => a.cost - b.cost || b.weight - a.weight
    );

    const nextAfforableAugmentation = sortedAfforableAugmentations[0];
    this.#log('nextAfforableAugmentation', nextAfforableAugmentation);
    if (nextAfforableAugmentation) {
      this.sing.purchaseAugmentation(
        nextAfforableAugmentation.faction,
        nextAfforableAugmentation.augmentName
      );
    }
  }

  // when getting an invite from CSEC, NiteSEC, etc, accept it automatically

  #log(...args) {
    utilLog('faction', ...args);
  }
}
