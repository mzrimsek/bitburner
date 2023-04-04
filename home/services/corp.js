import { log as utilLog, ACTIONS, ALL_CITIES, logEventHandler, CORP_OFFICE_UNITS } from 'utils.js';
import { EnvService } from 'services/env.js';

export class CorpService {
  #TOBACCO_DIVISION_NAMES = [
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

    this.envService = new EnvService(ns);
  }

  async handleCorporation() {
    const corpInfo = this.corp.getCorporation();
    const currentMoney = corpInfo.funds;

    const hasSmartSupply = this.#unlockUpgrade('Smart Supply', corpInfo);
    const hasWarehouseApi = this.#unlockUpgrade('Warehouse API', corpInfo);
    const hasOfficeApi = this.#unlockUpgrade('Office API', corpInfo);

    const currentDivisions = corpInfo.divisions;
    if (currentDivisions.length === 0) {
      // set up first division
      this.#log('Creating Tobacco Division as first division');
      const divisionName =
        this.#TOBACCO_DIVISION_NAMES[
          Math.floor(Math.random() * this.#TOBACCO_DIVISION_NAMES.length)
        ];
      this.corp.expandIndustry('Tobacco', divisionName);
      const divisionInfo = this.corp.getDivision(divisionName);

      // set up warehouses
      this.#initWarehouses(divisionInfo);

      // hire first 3 employees so we can start making products
      this.#hireFirstCityEmployees(divisionInfo);

      // set up products
      this.#handleProducts(divisionInfo);
    } else {
      currentDivisions.forEach(divisionName => {
        const divisionInfo = this.corp.getDivision(divisionName);
        const makesProducts = divisionInfo.makesProducts;

        if (hasWarehouseApi) {
          this.#initWarehouses(divisionInfo);
          this.#expandCities(divisionInfo);

          if (makesProducts) {
            this.#handleProducts(divisionInfo);
          }

          this.#handleMaterials(divisionInfo);

          this.#handleAds();
        }

        if (hasOfficeApi) {
          this.#handleResearch(divisionInfo);

          const hasMaxExpandedDivisions = this.#hasCorpFullyExpanded(corpInfo);
          const shouldAutoHire = this.envService.getDoCorpAutoHire();

          if (
            hasOfficeApi &&
            hasWarehouseApi &&
            hasSmartSupply &&
            hasMaxExpandedDivisions &&
            shouldAutoHire
          ) {
            divisionInfo.cities.forEach(async cityName => {
              const costToExpand = this.corp.getOfficeSizeUpgradeCost(
                divisionInfo.name,
                cityName,
                3
              );
              if (currentMoney >= costToExpand) {
                this.corp.upgradeOfficeSize(divisionInfo.name, cityName, 3);

                // get all employees in training or unallocated
                // add them to a unit

                const officeInfo = this.corp.getOffice(divisionInfo.name, cityName);
                const employees = officeInfo.employees;

                // hire new employees if we have any room
                const openSpaces = officeInfo.size - officeInfo.employees;
                for (let i = 0; i < openSpaces; i++) {
                  this.corp.hireEmployee(divisionInfo.name, cityName);
                }

                // await this.corp.setAutoJobAssignment(divisionInfo.name, cityName, CORP_OFFICE_UNITS.OPERATIONS, Math.floor((employees - 2) / 2));
                // await this.corp.setAutoJobAssignment(divisionInfo.name, cityName, CORP_OFFICE_UNITS.ENGINEERING, Math.ceil((employees - 2) / 2));
                // await this.corp.setAutoJobAssignment(divisionInfo.name, cityName, CORP_OFFICE_UNITS.MANAGEMENT, 2);
                // await this.corp.setAutoJobAssignment(divisionInfo.name, cityName, CORP_OFFICE_UNITS.BUSINESS, 0);
                // await this.corp.setAutoJobAssignment(divisionInfo.name, cityName, CORP_OFFICE_UNITS.TRAINING, 0);
                // await this.corp.setAutoJobAssignment(divisionInfo.name, cityName, CORP_OFFICE_UNITS.RESEARCH, 0);
              }
            });
          }
        }
      });

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

    // automate advertising - should only really prioritize this in divisions where advertising has a tangible benefit
    // we should probably have a list of divisions that we want to prioritize advertising in
    // probably need an env like stonks limit to limit how much corp money we spend on ads, expanding, etc
  }

  /**
   * @param {import("..").Division} divisionInfo
   * @param {string} cityName
   */
  #hireFirstCityEmployees(divisionInfo, cityName) {
    if (!cityName) {
      cityName = divisionInfo.cities[0];
    }

    this.#log(`Hiring first employees for ${divisionInfo.name} in ${cityName}`);

    this.corp.hireEmployee(divisionInfo.name, cityName, CORP_OFFICE_UNITS.OPERATIONS);
    this.corp.hireEmployee(divisionInfo.name, cityName, CORP_OFFICE_UNITS.ENGINEERING);
    this.corp.hireEmployee(divisionInfo.name, cityName, CORP_OFFICE_UNITS.BUSINESS);
  }

  #getCurrentMoney() {
    return this.corp.getCorporation().funds;
  }

  /**
   * @returns {bool} True if corporation has all research for all current divisions
   */
  hasAllResearch() {
    if (!this.hasCorp()) {
      return false;
    }

    const corpInfo = this.corp.getCorporation();
    const hasAllResearch = corpInfo.divisions.every(divisionName => {
      const divisionInfo = this.corp.getDivision(divisionName);
      return this.#getAvailableResearchForDivision(divisionInfo).length === 0;
    });
    return hasAllResearch;
  }

  /**
   * @return {bool} True if corporation has all divisions with offices in all cities
   * @param {import("..").CorporationInfo} divisionInfo
   * */
  #hasCorpFullyExpanded(corpInfo) {
    const maxNumDivisions = this.corp.getConstants().industryNames.length;
    const numCitiesUniqueDivisionsCanBeIn = ALL_CITIES.length * maxNumDivisions;

    const numCitiesUnqiueDivisionsAreIn = corpInfo.divisions.reduce((acc, divisionName) => {
      const divisionInfo = this.corp.getDivision(divisionName);
      return acc + divisionInfo.cities.length;
    }, 0);

    const hasMaxExpandedDivisions =
      numCitiesUnqiueDivisionsAreIn === numCitiesUniqueDivisionsCanBeIn;
    return hasMaxExpandedDivisions;
  }

  /** @param {import("..").Division} divisionInfo */
  #handleResearch(divisionInfo) {
    const currentResearch = divisionInfo.research;
    const researchesToTestCost = this.#getAvailableResearchForDivision(divisionInfo);
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
      this.eventHandler({
        action: ACTIONS.RESEARCH,
        name: divisionInfo.name,
        cost: researchToBuy.cost,
        type: researchToBuy.name
      });
    }
  }

  /** @param {import("..").Division} divisionInfo */
  #getAvailableResearchForDivision(divisionInfo) {
    return this.corp.getConstants().researchNames.filter(researchName => {
      if (!divisionInfo.makesProducts && researchName.includes('uPgrade:')) {
        return false;
      }
      return !this.corp.hasResearched(divisionInfo.name, researchName);
    });
  }

  /**
   * @description Attempts to unlock the upgrade if necessary and possibly
   * @param {string} upgradeName
   * @param {import("..").CorporationInfo} corpInfo
   * @returns bool Returns if the upgrade is owned */
  #unlockUpgrade(upgradeName, corpInfo) {
    const hasUpgrade = this.corp.hasUnlockUpgrade(upgradeName);
    if (!hasUpgrade) {
      const currentMoney = this.#getCurrentMoney();
      const costOfUpgrade = this.corp.getUnlockUpgradeCost(upgradeName);
      if (currentMoney >= costOfUpgrade) {
        this.#log(`Unlocking ${upgradeName}`);
        this.corp.unlockUpgrade(upgradeName);
        this.eventHandler({
          action: ACTIONS.UPGRADE,
          name: corpInfo.name,
          cost: costOfUpgrade,
          type: upgradeName
        });
        return true;
      }
    }
    return hasUpgrade;
  }

  /**
   * @param {import("..").Division} divisionInfo
   */
  #expandCities(divisionInfo) {
    ALL_CITIES.forEach(cityName => {
      const divisionHasCityOffice = divisionInfo.cities.includes(cityName);
      if (!divisionHasCityOffice) {
        const currentMoney = this.#getCurrentMoney();
        const officeCost = this.corp.getConstants().officeInitialCost;
        const canAffordOffice = currentMoney >= officeCost;
        if (canAffordOffice) {
          this.corp.expandCity(divisionInfo.name, cityName);
          this.eventHandler({
            action: ACTIONS.EXPAND,
            name: divisionInfo.name,
            cost: officeCost,
            type: cityName
          });
        }
      } else {
        const officeInfo = this.corp.getOffice(divisionInfo.name, cityName);
        if (officeInfo.employees === 0) {
          this.#hireFirstCityEmployees(divisionInfo, cityName);
        }
      }
    });
  }

  /**
   * @param {import("..").Division} divisionInfo
   */
  #initWarehouses(divisionInfo) {
    divisionInfo.cities.forEach(cityName => {
      if (this.corp.hasWarehouse(divisionInfo.name, cityName)) {
        // enable smart supply in each city with a warehouse
        const warehouse = this.corp.getWarehouse(divisionInfo.name, cityName);
        if (!warehouse.smartSupplyEnabled) {
          this.#log(`Enabling smart supply for ${divisionInfo.name} in ${cityName}`);
          this.corp.setSmartSupply(divisionInfo.name, cityName, true);
        }

        const currentMoney = this.#getCurrentMoney();
        const costToUpgrade = this.corp.getUpgradeWarehouseCost(divisionInfo.name, cityName, 5);
        if (currentMoney >= costToUpgrade && warehouse.level < 5) {
          this.#log(`Upgrading warehouse for ${divisionInfo.name} in ${cityName}`);
          this.corp.upgradeWarehouse(divisionInfo.name, cityName, 5);
          this.eventHandler({
            action: ACTIONS.EXPAND,
            name: divisionInfo.name,
            cost: costToUpgrade,
            type: cityName
          });
        }
      } else {
        // buy a warehouse if we don't have one
        const currentMoney = this.#getCurrentMoney();
        const warehouseCost = this.corp.getConstants().warehouseInitialCost;
        if (currentMoney >= warehouseCost) {
          this.#log(`Purchasing warehouse for ${divisionInfo.name} in ${cityName}`);
          this.corp.purchaseWarehouse(divisionInfo.name, cityName);
          this.eventHandler({
            action: ACTIONS.EXPAND,
            name: divisionInfo.name,
            cost: warehouseCost,
            type: cityName
          });
        }
      }
    });
  }

  /**
   * @param {import("..").Division} divisionInfo
   */
  #handleProducts(divisionInfo) {
    const has4thProductUnlock = this.corp.hasResearched(divisionInfo.name, 'uPgrade: Capacity.I');
    const has5thProductUnlock = this.corp.hasResearched(divisionInfo.name, 'uPgrade: Capacity.II');

    const getCity = () =>
      divisionInfo.cities[Math.floor(Math.random() * divisionInfo.cities.length)];

    const currentMoney = this.#getCurrentMoney();
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
            this.corp.sellProduct(divisionInfo.name, cityName, productName, 'MAX', 'MP', true); // just sell all the prooducts we can every cycle
          }
        }
      });
    }
  }

  // TODO add smarter logic to handle manging buying/selling production boosting materials
  /** @param {import("..").Division} divisionInfo */
  #handleMaterials(divisionInfo) {
    const industryData = this.corp.getIndustryData(divisionInfo.type);
    if (industryData.producedMaterials && industryData.producedMaterials.length > 0) {
      divisionInfo.cities.forEach(cityName => {
        industryData.producedMaterials.forEach(materialName => {
          const materialInfo = this.corp.getMaterial(divisionInfo.name, cityName, materialName);
          if (materialInfo.sCost !== 'MP') {
            this.corp.sellMaterial(divisionInfo.name, cityName, materialName, 'PROD', 'MP'); // just sell what we produce for now
          }
        });
      });
    }
  }

  // TODO add a threshhold similar to stonks to prevent this from killing all the money
  #handleAds() {
    const divisions = this.#getDivisions();
    const divisionsWhereAdsAreAffordable = divisions
      .filter(divisionInfo => {
        return divisionInfo.adCost <= this.#getCurrentMoney();
      })
      .sort((a, b) => b.industry.advertisingFactor - a.industry.advertisingFactor);
    const affordableDivisionsWorthAdvertisingIn = divisionsWhereAdsAreAffordable.filter(
      divisionInfo => {
        return divisionInfo.industry.advertisingFactor >= 0.1;
      }
    );
    const nextDivisionToAdvertiseIn = affordableDivisionsWorthAdvertisingIn[0];
    if (nextDivisionToAdvertiseIn) {
      this.#log(`Buying ad for ${nextDivisionToAdvertiseIn.name}`);
      this.corp.hireAdVert(nextDivisionToAdvertiseIn.name);
      this.eventHandler({
        action: ACTIONS.AD,
        name: nextDivisionToAdvertiseIn.name,
        cost: nextDivisionToAdvertiseIn.adCost,
        type: nextDivisionToAdvertiseIn.type
      });
    }
  }

  #getDivisions() {
    return this.corp.getCorporation().divisions.map(divisionName => {
      const divisionInfo = this.corp.getDivision(divisionName);
      const industry = this.corp.getIndustryData(divisionInfo.type);
      const adCost = this.corp.getHireAdVertCost(divisionInfo.name);
      return {
        ...divisionInfo,
        industry,
        adCost
      };
    });
  }

  hasCorp() {
    return this.corp.hasCorporation();
  }

  getDividendEarnings() {
    const corpInfo = this.corp.getCorporation();
    return this.ns.formatNumber(corpInfo.dividendEarnings);
  }

  #log(...args) {
    utilLog('corp', ...args);
  }
}
