import { PORT_MAPPING } from 'utils.js';

export class EnvService {

  /** @param {import("..").NS } ns */
  constructor(ns) {
    this.ns = ns;
  }

  getDoGang() {
    return this._getBooleanEnvVal('DO_GANG');
  }

  getDoBuy() {
    return this._getBooleanEnvVal('DO_BUY');
  }

  getDoStonks() {
    return this._getBooleanEnvVal('DO_STONKS');
  }

  getMillionsToKeepLiquid() {
    return this.ns.peek(PORT_MAPPING.STONKS_LIQUID_CASH_M);
  }

  _getBooleanEnvVal(name) {
    return this.ns.peek(PORT_MAPPING[name]) === 1;
  }
}