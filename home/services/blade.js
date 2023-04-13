import { log as utilLog, logEventHandler } from 'utils.js';

export class BladeService {
  /**
   * @param {import("..").NS } ns
   * @param {import("..").ScriptHandler} eventHandler
   */
  constructor(ns, eventHandler = logEventHandler) {
    this.ns = ns;
    this.blade = this.ns.bladeburner;

    this.eventHandler = eventHandler;
  }

  handleJoinBladeburner() {
    const player = this.ns.getPlayer();
    const { strength, defense, dexterity, agility } = player.skills;
    if (strength >= 100 && defense >= 100 && dexterity >= 100 && agility >= 100) {
      this.blade.joinBladeburnerDivision();
    }
  }

  handleBladeburner() {
    this.#log('handleBladeburner');
  }

  isBladeburner() {
    return this.blade.joinBladeburnerDivision();
  }

  isDoingBladeburner() {
    const currentActivity = this.blade.getCurrentAction();
    return currentActivity.type.toLowerCase() !== 'idle';
  }

  #log(...args) {
    utilLog('bladeburner', ...args);
  }
}
