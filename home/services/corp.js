export class CorpService {
  /** @param {import("..").NS } ns */
  constructor(ns) {
    this.ns = ns;
    this.corp = this.ns.corporation;
  }

  /** @param {import("..").ScriptHandler?} eventHandler */
  handleCorporation(eventHandler) {

  }

  hasCorp() {
    return this.corp.getCorporation() != null;
  }

  getDividendEarnings() {
    const corpInfo = this.corp.getCorporation();
    return this.ns.formatNumber(corpInfo.dividendEarnings);
  }

}