import { log as utilLog, hasFormulas, getDocument, logEventHandler } from 'utils.js';

export class LocationService {
  /**
   * @param {import("..").NS } ns
   * @param {import("..").ScriptHandler} eventHandler
   */
  constructor(ns, eventHandler = logEventHandler) {
    this.ns = ns;

    this.eventHandler = eventHandler;
  }

  getCurrentPage() {
    const document = getDocument();
    // try to get the header for the page
    // if you can find it, return the contents of the header tag
    // otherwise return null;
  }

  // idea with this is to detect where you are in the game to make UI changes we can hook into

  #log(...args) {
    utilLog('location', ...args);
  }
}
