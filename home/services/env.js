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

  // TODO fix this
  hasSingularity() {
    // singularity is source file 4
    // wait...im using singularity to determine if i have singularity?
    const ownedSourceFiles = this.ns.singularity.getOwnedSourceFiles();
    return ownedSourceFiles.some(sourceFile => sourceFile.n === 4);
  }

  hasAllStockAccess() {
    return (
      this.ns.stock.hasWSEAccount() &&
      this.ns.stock.hasTIXAPIAccess() &&
      this.ns.stock.has4SData() &&
      this.ns.stock.has4SDataTIXAPI()
    );
  }

  #getBooleanEnvVal(name) {
    return this.ns.peek(PORT_MAPPING[name]) === 1;
  }
}
