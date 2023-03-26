export class CorpService {
  /** @param {import("..").NS } ns */
  constructor(ns) {
    this.ns = ns;
    this.corp = this.ns.corporation;
  }

  /** @param {import("..").ScriptHandler?} eventHandler */
  handleCorporation(eventHandler) {
    const corpInfo = this.corp.getCorporation();
    const currentMoney = corpInfo.funds;

    // if you do not have smart supply, it should be the first thing you buy with a new corp
    const hasSmartSupply = this.corp.hasUnlockUpgrade('Smart Supply');
    if (!hasSmartSupply) {
      const costOfSmartSupply = this.corp.getUnlockUpgradeCost('Smart Supply');
      if (currentMoney >= costOfSmartSupply) {
        this.corp.unlockUpgrade('Smart Supply');
      }
    } else {

      // handle divisions
      const currentDivisions = corpInfo.divisions;

      if (currentDivisions === 0) {
        // create a tobacco division
      } else {
        // create products

        // if division has products, create 3
        // 1 with 1b invested in both
        // 2 with 1m invested in each

        // expand division to new city
        // buy a warehouse
        // enable smart supply
        // repeat until have expanded to all cities and have a warehouse in each

        // for each product/byproduct in division
        // if product is produced with no sell price set
        // set to MAX MP
        // if byproduct is produced with no sell price set
        // set to PROD MP

        // eventually we want to add logic here to buy products that will boost production
        // for each division we will want to look at pricing in each city to determine where to buy
        // only buy up to 80% warehouse capacity
        // probably want logic to upgrade warehouse size
        // possibly incorporate bulk buying into this logic?
      }

      // handle hiring and allocating - we only need to worry about logic for expanding bc there is a research for automatic hiring
      // I think we should look at all divisions in all cities and evenly build up everything
      // we should have percentages defined to determine how much to allocate to each type of employee

      // handle research

      // handle repeat upgrades

      // if exporting is available
      // add logic to export products to and from cities for each division to optimize profit
    }
  }

  hasCorp() {
    return this.corp.getCorporation() != null;
  }

  getDividendEarnings() {
    const corpInfo = this.corp.getCorporation();
    return this.ns.formatNumber(corpInfo.dividendEarnings);
  }

}