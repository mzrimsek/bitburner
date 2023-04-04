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
    const currentJob = this.sing.getCurrentWork();
    this.#log(`Current job: ${currentJob}`);
  }

  // if working for a faction
  // and that faction has available augments that are affordable
  // buy the cheapest augment until all available augments are bought
  // maybe should also check any augments for current factions, but weight the ones for the current faction higher

  #log(...args) {
    utilLog('faction', ...args);
  }
}
