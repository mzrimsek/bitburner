export class StartupService {
  /**
   * @param {import("..").NS } ns
   * @param {import("..").ScriptHandler} eventHandler
   */
  constructor(ns, eventHandler = logEventHandler) {
    this.ns = ns;
    this.sing = ns.singularity;
    this.corp = ns.corporation;
    this.stock = ns.stock;

    this.eventHandler = eventHandler;
  }

  setup() {
    this.#setupHome();
    this.#setupDarkweb();
    this.#setupStonks();
    this.#setupCorp();
  }

  #setupDarkweb() {
    const darkWebCost = 200000; // 200k
    if (this.#getCurrentMoney() >= darkWebCost) {
      this.sing.purchaseTor();
    }

    const darkWebProgramNames = this.sing.getDarkwebPrograms();
    darkWebProgramNames.forEach(programName => {
      if (this.#getCurrentMoney() >= this.sing.getDarkwebProgramCost(programName)) {
        this.sing.purchaseProgram(programName);
      }
    });
  }

  #setupStonks() {
    this.stock.purchaseWseAccount();
    this.stock.purchaseTixApi();
    this.stock.purchase4SMarketData();
    this.stock.purchase4SMarketDataTixApi();
  }

  #setupHome() {
    const ramCost = this.sing.getUpgradeHomeRamCost();
    if (this.#getCurrentMoney() >= ramCost) {
      this.sing.upgradeHomeRam();
    }

    const coreCost = this.sing.getUpgradeHomeCoresCost();
    if (this.#getCurrentMoney() >= coreCost) {
      this.sing.upgradeHomeCores();
    }
  }

  #setupCorp() {
    const corpCost = 150000000000; // 150 billion
    if (!this.corp.hasCorporation() && this.#getCurrentMoney() >= corpCost) {
      this.corp.createCorporation('Nova Corp', true);
    }
  }

  #getCurrentMoney = () => this.ns.getPlayer().money;
}
