import { log as utilLog, hasFormulas, getDocument, logEventHandler } from 'utils.js';

export class GraftingService {
  #FOCUS_AUGMENTATION = 'Neuroreceptor Management Implant';

  /**
   * @param {import("..").NS } ns
   * @param {import("..").ScriptHandler} eventHandler
   */
  constructor(ns, eventHandler = logEventHandler) {
    this.ns = ns;
    this.graft = ns.grafting;

    this.eventHandler = eventHandler;
  }

  getFocusAugmentation() {
    // if we don't have the focus augmentation, buy it so we can do stuff in the hackground without penalty
  }

  canGraft() {
    try {
      this.graft.getGraftableAugmentations();
      return true;
    } catch {
      return false;
    }
  }

  #log(...args) {
    utilLog('location', ...args);
  }
}
