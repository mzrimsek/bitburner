import { ACTIONS, logEventHandler } from 'utils.js';

export class SleeveService {
  #SHOCK_MIN = 0;
  #SYNC_MAX = 100;

  /**
   * @param {import("..").NS } ns
   * @param {import("..").ScriptHandler} eventHandler
   */
  constructor(ns, eventHandler = logEventHandler) {
    this.ns = ns;
    this.sleeve = this.ns.sleeve;

    this.eventHandler = eventHandler;
  }

  handleSleeves() {
    const sleeves = this.#getSleeves();
    sleeves.forEach((sleeve, index) => {
      if (sleeve.shock !== this.#SHOCK_MIN) {
        this.sleeve.setToShockRecovery(index);
        this.eventHandler({
          action: ACTIONS.SHOCK,
          name: `Sleeve ${index}`
        });
      } else if (sleeve.sync !== this.#SYNC_MAX) {
        this.sleeve.setToSynchronize(index);
        this.eventHandler({
          action: ACTIONS.SYNC,
          name: `Sleeve ${index}`
        });
      } else {
        const augmentsForSale = this.sleeve.getSleevePurchasableAugs(index);
        const affordableAugments = augmentsForSale.filter(augment => {
          return this.ns.getPlayer().money >= augment.cost;
        });
        const augmentsByCost = affordableAugments.sort((a, b) => a.cost - b.cost);
        if (augmentsByCost.length > 0) {
          const augment = augmentsByCost[0];
          this.sleeve.purchaseSleeveAug(index, augment.name);
          this.eventHandler({
            action: ACTIONS.AUGMENT,
            name: `Sleeve ${index}`,
            type: augment.name
          });
        }
      }
    });
  }

  hasSleeves() {
    return this.sleeve.getNumSleeves() > 0;
  }

  #getSleeves() {
    const numSleeves = this.sleeve.getNumSleeves();
    return new Array(numSleeves).map((_, i) => this.sleeve.getSleeve(i));
  }
}
