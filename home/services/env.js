import { PORT_MAPPING } from 'utils.js';

export class EnvService {
  /** @param {import("..").NS } ns */
  constructor(ns) {
    this.ns = ns;
  }

  getDoGang() {
    return this.#getBooleanEnvVal('DO_GANG');
  }

  getShouldAscendGangMembers() {
    return this.#getBooleanEnvVal('DO_GANG_ASCEND');
  }

  getDoBuy() {
    return this.#getBooleanEnvVal('DO_BUY');
  }

  getDoStonks() {
    return this.#getBooleanEnvVal('DO_STONKS');
  }

  getDoCorpAutoHire() {
    return this.#getBooleanEnvVal('DO_CORP_AUTOHIRE');
  }

  getDoCorpAutoAds() {
    return this.#getBooleanEnvVal('DO_CORP_AUTOAD');
  }

  getMillionsToKeepLiquid() {
    return this.ns.peek(PORT_MAPPING.STONKS_LIQUID_CASH_M);
  }

  #getBooleanEnvVal(name) {
    return this.ns.peek(PORT_MAPPING[name]) === 1;
  }
}
