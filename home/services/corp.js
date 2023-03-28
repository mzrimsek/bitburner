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

    // if you do not have smart supply, it should be the first thing you buy with a new corp
    const hasSmartSupply = this.corp.hasUnlockUpgrade('Smart Supply');
    if (!hasSmartSupply) {
      const costOfSmartSupply = this.corp.getUnlockUpgradeCost('Smart Supply');
      if (currentMoney >= costOfSmartSupply) {
        this.corp.unlockUpgrade('Smart Supply');
      }
    } else {
      const currentDivisions = corpInfo.divisions;
      if (currentDivisions === 0) {
        // create a tobacco division
        const divisionName =
          this.TOBACCO_DIVISION_NAMES[
            Math.floor(Math.random() * this.TOBACCO_DIVISION_NAMES.length)
          ];
        this.corp.expandIndustry('Tobacco', divisionName);
      } else {
        currentDivisions.forEach(divisionName => {
          const divisionInfo = this.corp.getDivision(divisionName);
          const makesProducts = divisionInfo.makesProducts;

          // enable smart supply in all cities
          divisionInfo.cities.forEach(cityName => {
            const info = this.corp.setSmartSupplyUseLeftovers;
          });

          if (makesProducts) {
            const products = divisionInfo.products;

            if (products.length === 0 && currentMoney >= 3000000000) {
              const getCity = () =>
                divisionInfo.cities[Math.floor(Math.random() * divisionInfo.cities.length)];

              this.corp.makeProduct(
                divisionInfo.name,
                getCity(),
                'Product 1',
                1000000000,
                1000000000
              );
              this.corp.makeProduct(
                divisionInfo.name,
                getCity(),
                'Product 2',
                250000000,
                250000000
              );
              this.corp.makeProduct(
                divisionInfo.name,
                getCity(),
                'Product 3',
                250000000,
                250000000
              );
            } else {
              if (this.hasWarehouseApi()) {
                products.forEach(productName => {
                  const productInfo = this.corp.getProduct(divisionInfo.name, productName);
                  if (productInfo.developmentProgress === 100 && !productInfo.sCost) {
                    divisionInfo.cities.forEach(cityName => {
                      this.corp.sellProduct(divisionInfo.name, cityName, productName, 'MAX', 'MP');
                    });
                  }
                });
              }
            }
          }
          console.log(divisionInfo);
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
  }

  hasCorp() {
    try {
      return this.corp.getCorporation() != null; // the != is intentional to try and catch more falsy cases
    } catch {
      return false;
    }
  }

  hasWarehouseApi() {
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
