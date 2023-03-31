import { log as utilLog, ACTIONS, ALL_CITIES, logEventHandler } from 'utils.js';

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

  /**
   * @param {import("..").NS } ns
   * @param {import("..").ScriptHandler} eventHandler
   */
  constructor(ns, eventHandler = logEventHandler) {
    this.ns = ns;
    this.corp = this.ns.corporation;

    this.eventHandler = eventHandler;
  }

  handleCorporation() {
    const corpInfo = this.corp.getCorporation();
    const currentMoney = corpInfo.funds;

    this.#unlockUpgrade('Smart Supply');
    this.#unlockUpgrade('Warehouse API');
    this.#unlockUpgrade('Office API');

    const currentDivisions = corpInfo.divisions;
    if (currentDivisions.length === 0) {
      this.#log('Creating Tobacco Division as first division');
      const divisionName =
        this.TOBACCO_DIVISION_NAMES[Math.floor(Math.random() * this.TOBACCO_DIVISION_NAMES.length)];
      this.corp.expandIndustry('Tobacco', divisionName);
    } else {
      currentDivisions.forEach(divisionName => {
        const divisionInfo = this.corp.getDivision(divisionName);
        const makesProducts = divisionInfo.makesProducts;

        if (this.#hasWarehouseApi()) {
          this.#initWarehouses(divisionInfo, currentMoney);
          this.#expandCities(divisionInfo, currentMoney);

          if (makesProducts) {
            this.#handleProducts(divisionInfo, currentMoney);
          }
        }

        if (this.#hasOfficeApi()) {
          this.#handleResearch(divisionInfo);
        }
      });

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

    // figure out logic for Market-TA.I or Market-TA.II

    // handle repeat upgrades

    // if exporting is available
    // add logic to export products to and from cities for each division to optimize profit

    // need to add logic to handle buying the items that boost production
  }

  /** @param {import("..").Division} divisionInfo */
  #handleResearch(divisionInfo) {
    const currentResearch = divisionInfo.research;
    const researchesToTestCost = this.corp.getConstants().researchNames.filter(researchName => {
      if (!divisionInfo.makesProducts && researchName.includes('uPgrade:')) {
        return false;
      }
      return !this.corp.hasResearched(divisionInfo.name, researchName);
    });
    const researchToTestInfo = researchesToTestCost.map(researchName => {
      const cost = this.corp.getResearchCost(divisionInfo.name, researchName);
      return { name: researchName, cost };
    });
    const researchesToBuy = researchToTestInfo.filter(researchInfo => {
      return researchInfo.cost <= currentResearch;
    });
    const sortedResearchesToBuy = researchesToBuy.sort((a, b) => a.cost - b.cost);

    if (sortedResearchesToBuy.length > 0) {
      const researchToBuy = sortedResearchesToBuy[0];
      this.#log(`Buying research ${researchToBuy.name}`);
      this.corp.research(divisionInfo.name, researchToBuy.name);
    }
  }

  #unlockUpgrade(upgradeName) {
    const hasUpgrade = this.corp.hasUnlockUpgrade(upgradeName);
    if (!hasUpgrade) {
      const costOfUpgrade = this.corp.getUnlockUpgradeCost(upgradeName);
      if (currentMoney >= costOfUpgrade) {
        this.#log(`Unlocking ${upgradeName}`);
        this.corp.unlockUpgrade(upgradeName);
      }
    }
  }

  /**
   * @param {import("..").Division} divisionInfo
   * @param {number} currentMoney
   */
  #expandCities(divisionInfo, currentMoney) {
    const citiesWithoutOffice = ALL_CITIES.filter(
      cityName => !divisionInfo.cities.includes(cityName)
    );
    citiesWithoutOffice.forEach(cityName => {
      const officeCost = this.corp.getConstants().officeInitialCost;
      if (currentMoney >= officeCost) {
        this.corp.expandCity(divisionInfo.name, cityName);
      }
    });
  }

  /**
   * @param {import("..").Division} divisionInfo
   * @param {number} currentMoney
   */
  #initWarehouses(divisionInfo, currentMoney) {
    divisionInfo.cities.forEach(cityName => {
      if (this.corp.hasWarehouse(divisionInfo.name, cityName)) {
        // enable smart supply in each city with a warehouse
        if (!this.corp.getWarehouse(divisionInfo.name, cityName).smartSupplyEnabled) {
          this.#log(`Enabling smart supply for ${divisionInfo.name} in ${cityName}`);
          this.corp.setSmartSupply(divisionInfo.name, cityName, true);
        }
      } else {
        // buy a warehouse if we don't have one
        const warehouseCost = this.corp.getConstants().warehouseInitialCost;
        if (currentMoney >= warehouseCost) {
          this.#log(`Purchasing warehouse for ${divisionInfo.name} in ${cityName}`);
          this.corp.purchaseWarehouse(divisionInfo.name, cityName);
        }
      }
    });
  }

  /**
   * @param {import("..").Division} divisionInfo
   * @param {number} currentMoney
   */
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
        const cityName = getCity();
        if (this.corp.hasWarehouse(divisionInfo.name, cityName)) {
          const productInfo = this.corp.getProduct(divisionInfo.name, productName);
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
    return this.corp.hasUnlockUpgrade('Warehouse API');
  }

  #hasOfficeApi() {
    return this.corp.hasUnlockUpgrade('Office API');
  }

  getDividendEarnings() {
    const corpInfo = this.corp.getCorporation();
    return this.ns.formatNumber(corpInfo.dividendEarnings);
  }

  #log(...args) {
    utilLog('corp', ...args);
  }
}
