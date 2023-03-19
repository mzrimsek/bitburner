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
      if (sleeve.shock > this.SHOCK_THRESHOLD) {
        this.sleeve.setToShockRecovery(index);
        eventHandler && eventHandler({
          action: 'shock',
          name: `Sleeve ${index}`
        });
      } else if (sleeve.sync < this.SYNC_THRESHOLD) {
        this.sleeve.setToSynchronize(index);
        eventHandler && eventHandler({
          action: 'sync',
          name: `Sleeve ${index}`
        });
      }
    });
  }

  _getSleeves() {
    const numSleeves = this.sleeve.getNumSleeves();
    return new Array(numSleeves).map((_, i) => this.sleeve.getSleeve(i));
  }
}