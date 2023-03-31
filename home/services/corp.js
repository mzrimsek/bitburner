export class CorpService {
  TOBACCO_DIVISION_NAMES = [
    'Leaf Life',
    'Smokes Unlimited Inc.',
    'Cigarette Corp.',
    'Smoke and Mirrors',
    'Nicotine Nation Corp.',
    'Puff Puff Inc.',
    'Cloud Chasers Corp.'
  ];

  /** @param {import("..").NS } ns */
  constructor(ns) {
    this.ns = ns;
    this.corp = this.ns.corporation;
  }

  /** @param {import("..").ScriptHandler?} eventHandler */
  handleCorporation(eventHandler) {
    const corpInfo = this.corp.getCorporation();
    const currentMoney = corpInfo.funds;

    const currentDivisions = corpInfo.divisions;
    if (currentDivisions.length === 0) {
      // create a tobacco division
      const divisionName =
        this.TOBACCO_DIVISION_NAMES[Math.floor(Math.random() * this.TOBACCO_DIVISION_NAMES.length)];
      this.corp.expandIndustry('Tobacco', divisionName);

      // if you do not have smart supply, it should be the first thing you buy with a new corp
      const hasSmartSupply = this.corp.hasUnlockUpgrade('Smart Supply');
      if (!hasSmartSupply) {
        const costOfSmartSupply = this.corp.getUnlockUpgradeCost('Smart Supply');
        if (currentMoney >= costOfSmartSupply) {
          this.corp.unlockUpgrade('Smart Supply');
        }
      }
    } else {
      currentDivisions.forEach(divisionName => {
        const divisionInfo = this.corp.getDivision(divisionName);
        const makesProducts = divisionInfo.makesProducts;

        if (this.#hasWarehouseApi()) {
          // enable smart supply in each city with a warehouse
          divisionInfo.cities.forEach(cityName => {
            if (
              this.corp.hasWarehouse(divisionName, cityName) &&
              !this.corp.getWarehouse(divisionName, cityName).smartSupplyEnabled
            ) {
              this.corp.setSmartSupply(divisionName, cityName, true);
            }
          });

          if (makesProducts) {
            this.#handleProducts(divisionInfo, currentMoney);
          }
        }
      });

      // expand division to new city
      // buy a warehouse
      // enable smart supply
      // repeat until have expanded to all cities and have a warehouse in each

      // for each product/byproduct in division
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

  #handleProducts(divisionInfo, currentMoney) {
    const has4thProductUnlock = this.corp.hasResearched(divisionInfo.name, 'uPgrade: Capacity.I');
    const has5thProductUnlock = this.corp.hasResearched(divisionInfo.name, 'uPgrade: Capacity.II');

    const getCity = () =>
      divisionInfo.cities[Math.floor(Math.random() * divisionInfo.cities.length)];

    if (divisionInfo.products.length === 0 && currentMoney >= 3000000000) {
      this.corp.makeProduct(divisionInfo.name, getCity(), 'Product 1', 1000000000, 1000000000);
      this.corp.makeProduct(divisionInfo.name, getCity(), 'Product 2', 250000000, 250000000);
      this.corp.makeProduct(divisionInfo.name, getCity(), 'Product 3', 250000000, 250000000);
    } else if (
      divisionInfo.products.length === 3 &&
      currentMoney >= 500000000 &&
      has4thProductUnlock
    ) {
      this.corp.makeProduct(divisionInfo.name, getCity(), 'Product 4', 250000000, 250000000);
    } else if (
      divisionInfo.products.length === 4 &&
      currentMoney >= 500000000 &&
      has5thProductUnlock
    ) {
      this.corp.makeProduct(divisionInfo.name, getCity(), 'Product 5', 250000000, 250000000);
    } else {
      divisionInfo.products.forEach(productName => {
        if (this.corp.hasWarehouse(divisionInfo.name, getCity())) {
          const productInfo = this.corp.getProduct(divisionInfo.name, productName);
          // set each finished product to sell at market price
          if (productInfo.developmentProgress === 100 && productInfo.sCost !== 'MP') {
            this.corp.sellProduct(divisionInfo.name, cityName, productName, 'MAX', 'MP', true);
          }
        }
      });
    }
  }

  hasCorp() {
    return this.corp.hasCorporation();
  }

  #hasWarehouseApi() {
    try {
      const corpInfo = this.corp.getCorporation();
      const testDivision = this.corp.getDivision(corpInfo.divisions[0]);
      const testCity = testDivision.cities[0];
      this.corp.getUpgradeWarehouseCost(testDivision.name, testCity);
      return true;
    } catch {
      return false;
    }
  }

  getDividendEarnings() {
    const corpInfo = this.corp.getCorporation();
    return this.ns.formatNumber(corpInfo.dividendEarnings);
  }
}
