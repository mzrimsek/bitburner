import { log as utilLog, logEventHandler } from 'utils.js';

export class FactionService {
  /**
   * @param {import("..").NS } ns
   * @param {import("..").ScriptHandler} eventHandler
   */
  constructor(ns, eventHandler = logEventHandler) {
    this.ns = ns;

    this.eventHandler = eventHandler;

    this.envService = new EnvService(ns);
  }

  // if working for a faction
  // and that faction has available augments that are affordable
  // buy the cheapest augment until all available augments are bought

  #log(...args) {
    utilLog('faction', ...args);
  }
}
