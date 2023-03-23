import { ACTIONS } from 'utils.js';

export class SleeveService {

  SHOCK_THRESHOLD = 25;
  SYNC_THRESHOLD = 800;

  /** @param {import("..").NS } ns */
  constructor(ns) {
    this.ns = ns;
    this.sleeve = this.ns.sleeve;
  }

  /** @param {import("..").ScriptHandler?} eventHandler */
  handleSleeves(eventHandler) {
    const sleeves = this._getSleeves();
    sleeves.forEach((sleeve, index) => {
      if (sleeve.shock > this.SHOCK_THRESHOLD && this.sleeve.getTask(index).type !== 'RECOVERY') {
        this.sleeve.setToShockRecovery(index);
        eventHandler && eventHandler({
          action: ACTIONS.SHOCK,
          name: `Sleeve ${index}`
        });
      } else if (sleeve.sync < this.SYNC_THRESHOLD && this.sleeve.getTask(index).type !== 'SYNCHRO') {
        this.sleeve.setToSynchronize(index);
        eventHandler && eventHandler({
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
          eventHandler && eventHandler({
            action: ACTIONS.AUGMENT,
            name: `Sleeve ${index}`,
            name: augment.name
          });
        }
      }
    });
  }

  _getSleeves() {
    const numSleeves = this.sleeve.getNumSleeves();
    return new Array(numSleeves).map((_, i) => this.sleeve.getSleeve(i));
  }
}