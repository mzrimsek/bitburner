export class StartupService {
  /**
   * @param {import("..").NS } ns
   * @param {import("..").ScriptHandler} eventHandler
   */
  constructor(ns, eventHandler = logEventHandler) {
    this.ns = ns;
    this.sing = ns.singularity;
    this.eventHandler = eventHandler;
  }

  setupDarkweb() {
    if (this.ns.getPlayer().money >= 200000) {
      this.sing.purchaseTor();
    }

    const darkWebProgramNames = this.sing.getDarkwebPrograms();
    darkWebProgramNames.forEach(programName => {
      if (this.ns.getPlayer().money >= this.sing.getDarkwebProgramCost(programName)) {
        this.sing.purchaseProgram(programName);
      }
    });
  }

  setupStonks() {
    this.ns.stock.purchaseWseAccount();
    this.ns.stock.purchaseTixApi();
    this.ns.stock.purchase4SMarketData();
    this.ns.stock.purchase4SMarketDataTixApi();
  }

  setupHome() {
    const ramCost = this.sing.getUpgradeHomeRamCost();
    if (this.ns.getPlayer().money >= ramCost) {
      this.sing.upgradeHomeRam();
    }

    const coreCost = this.sing.getUpgradeHomeCoresCost();
    if (this.ns.getPlayer().money >= coreCost) {
      this.sing.upgradeHomeCores();
    }
  }
}
