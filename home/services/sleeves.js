import { log as utilLog, ACTIONS, logEventHandler } from 'utils.js';

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
      const sleeveTask = this.sleeve.getTask(index);

      if (sleeve.shock !== this.#SHOCK_MIN) {
        const currentTaskIsShockRecovery = sleeveTask.type === 'RECOVERY';
        if (!currentTaskIsShockRecovery) {
          this.#log(`Sleeve ${index} is in shock, recovering...`);
          this.sleeve.setToShockRecovery(index);
          this.eventHandler({
            action: ACTIONS.SHOCK,
            name: `Sleeve ${index}`
          });
        }
      } else if (sleeve.sync !== this.#SYNC_MAX && !isSync) {
        const currentTaskIsSynchronize = sleeveTask.type === 'SYNCHRO';
        if (!currentTaskIsSynchronize) {
          this.sleeve.setToSynchronize(index);
          this.eventHandler({
            action: ACTIONS.SYNC,
            name: `Sleeve ${index}`
          });
        }
      } else {
        this.#handleSleeveAugments(index);
        const isHomicide =
          sleeveTask && sleeveTask.type === 'CRIME' && sleeveTask.crimeType === 'Homicide';
        if (!isHomicide) {
          this.sleeve.setToCommitCrime(index, 'Homicide');
          this.eventHandler({
            action: ACTIONS.CRIME,
            name: `Sleeve ${index}`
          });
        }
      }
    });
  }

  hasSleeves() {
    return this.sleeve.getNumSleeves() > 0;
  }

  #handleSleeveAugments(index) {
    const augmentsForSale = this.sleeve.getSleevePurchasableAugs(index);
    const affordableAugments = augmentsForSale.filter(augment => {
      return this.ns.getPlayer().money >= augment.cost;
    });
    const augmentsByCost = affordableAugments.sort((a, b) => a.cost - b.cost);
    if (augmentsByCost.length > 0) {
      const augment = augmentsByCost[0];
      this.sleeve.purchaseSleeveAug(index, augment.name);
      this.#log(`Sleeve ${index} purchased ${augment.name} for ${augment.cost}`);
      this.eventHandler({
        action: ACTIONS.AUGMENT,
        name: `Sleeve ${index}`,
        type: augment.name
      });
    }

    // public function that appends buttons to the factions UI
    // when you click that button is sets an override in the service
    // that sets a sleeve to work for that faction for a certain amount of time
    // if the faction offers field work or security work, take it
    // otherwise do hacking contracts
  }

  #getSleeves() {
    const numSleeves = this.sleeve.getNumSleeves();
    const sleeves = [];
    for (let i = 0; i < numSleeves; i++) {
      sleeves.push(this.sleeve.getSleeve(i));
    }
    return sleeves;
  }

  #log(...args) {
    utilLog('sleeve', ...args);
  }
}
