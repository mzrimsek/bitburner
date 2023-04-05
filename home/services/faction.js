import { log as utilLog, logEventHandler } from 'utils.js';
import { EnvService } from 'services/env.js';

export class FactionService {
  #SPECIAL_FACTIONS = ['CSEC', 'NiteSec', 'The Black Hand', 'BitRunners'];

  #EXTRA_SPECIAL_FACTIONS = ['Illuminati', 'The Covenant'];

  #EXIT_FACTION = 'Daedalus';

  #MAX_COMPANY_RANKS = ['CTO', 'CFO', 'CEO'];

  /**
   * @param {import("..").NS } ns
   * @param {import("..").ScriptHandler} eventHandler
   */
  constructor(ns, eventHandler = logEventHandler) {
    this.ns = ns;
    this.sing = ns.singularity;

    this.eventHandler = eventHandler;

    this.envService = new EnvService(ns);
  }

  handleCurrentFactionAugments() {
    const purchasedAndInstalledAugmentations = this.sing.getOwnedAugmentations(true);
    const currentFactions = this.ns.getPlayer().factions;
    const currentJob = this.sing.getCurrentWork();

    const currentFactionAugmentations = currentFactions.reduce((acc, faction) => {
      const factionAugmentations = this.sing.getAugmentationsFromFaction(faction);
      return [...acc, ...factionAugmentations];
    }, []);

    const currentFactionAugmentationsToBuy = currentFactionAugmentations.filter(
      augmentName => !purchasedAndInstalledAugmentations.includes(augmentName)
    );

    const currentFactionAugmentationsToBuyWithDetails = currentFactionAugmentationsToBuy.map(
      augmentName => {
        const faction = currentFactions.find(faction =>
          this.sing.getAugmentationsFromFaction(faction).includes(augmentName)
        );
        const cost = this.sing.getAugmentationPrice(augmentName);
        const rep = this.sing.getAugmentationRepReq(augmentName);
        const weight =
          currentJob && currentJob.type === 'FACTION' && currentJob.factionName === faction ? 2 : 1;
        return { augmentName, faction, cost, rep, weight };
      }
    );

    const currentMoney = this.ns.getPlayer().money;
    const afforableFactionAugmentationsToBuy = currentFactionAugmentationsToBuyWithDetails.filter(
      ({ cost, faction, rep }) => {
        const factionRep = this.sing.getFactionRep(faction);
        return currentMoney >= cost && factionRep >= rep;
      }
    );

    const sortedAfforableAugmentations = afforableFactionAugmentationsToBuy.sort(
      (a, b) => a.cost - b.cost || b.weight - a.weight
    );

    const nextAfforableAugmentation = sortedAfforableAugmentations[0];
    if (nextAfforableAugmentation) {
      this.#log(
        `Purchasing ${nextAfforableAugmentation.augmentName} from ${nextAfforableAugmentation.faction}`
      );
      this.sing.purchaseAugmentation(
        nextAfforableAugmentation.faction,
        nextAfforableAugmentation.augmentName
      );
    }
  }

  handleSwitchingFactions() {
    const currentJob = this.sing.getCurrentWork();
    if (currentJob.type === 'FACTION') {
      const factionName = currentJob.factionName;
      const purchasedAugments = this.sing.getOwnedAugmentations(true);
      const factionAugments = this.sing.getAugmentationsFromFaction(factionName);
      const factionAugmentsNotPurchased = factionAugments.filter(
        augmentName => !purchasedAugments.includes(augmentName)
      );

      if (factionAugmentsNotPurchased.length === 0) {
        const factions = this.ns.getPlayer().factions;
        const factionsWithAugmentsNotPurchased = factions.filter(faction => {
          const factionAugments = this.sing.getAugmentationsFromFaction(faction);
          const factionAugmentsNotPurchased = factionAugments.filter(
            augmentName => !purchasedAugments.includes(augmentName)
          );
          return factionAugmentsNotPurchased.length > 0;
        });

        const factionsWithAugmentsNotPurchasedWithRep = factionsWithAugmentsNotPurchased.map(
          faction => {
            const rep = this.sing.getFactionRep(faction);
            const weight = this.#getFactionWeight(faction);
            return { faction, rep, weight };
          }
        );
        // if a special faction has available augments, prioritize it over other factions, from there just pick the one with the least rep
        const sortedFactionsWithAugmentsNotPurchasedWithRep =
          factionsWithAugmentsNotPurchasedWithRep.sort(
            (a, b) => b.weight - a.weight || a.rep - b.rep
          );
        const nextFaction = sortedFactionsWithAugmentsNotPurchasedWithRep[0];

        if (nextFaction) {
          const tryToDoFieldWork = this.sing.workForFaction(nextFaction.faction, 'field', false);
          if (!tryToDoFieldWork) {
            const tryToDoSecurityWork = this.sing.workForFaction(
              nextFaction.faction,
              'security',
              false
            );
            if (!tryToDoSecurityWork) {
              this.sing.workForFaction(nextFaction.faction, 'hacking', false);
            }
          }
        } else {
          this.sing.commitCrime('Homicide');
        }
      }
    }
  }

  // TODO make this work
  handleCompanyPromotions() {
    const company = this.#getCurrentActivity();
    if (company) {
      const currentRoleAtCompany = this.ns.getPlayer().jobs[company];
      const wasPromoted = this.sing.applyToCompany(company, currentRoleAtCompany);
      if (wasPromoted) {
        this.eventHandler({
          action: ACTIONS.HIRE,
          name: company,
          type: this.ns.getPlayer().jobs[company]
        });
      }
    }
  }

  handleSwitchCompanies() {
    // basically if the current company you're at you're one of the top jobs
    // then see if there are another other companies we have a job at that we can switch to
  }

  isWorkingForFaction() {
    const currentJob = this.sing.getCurrentWork();
    return currentJob && currentJob.type === 'FACTION';
  }

  isWorkingForCompany() {
    const currentJob = this.sing.getCurrentWork();
    return currentJob && currentJob.type === 'COMPANY';
  }

  isGrafting() {
    const currentJob = this.sing.getCurrentWork();
    return currentJob && currentJob.type === 'GRAFTING';
  }

  /**
   *
   * @returns {string | null} Returns string if working for a faction or company or grafting, null otherwise
   */
  #getCurrentActivity() {
    const currentJob = this.sing.getCurrentWork();
    if (this.isWorkingForFaction()) {
      return currentJob.factionName;
    }

    if (this.isWorkingForCompany()) {
      return currentJob.companyName;
    }

    if (this.isGrafting()) {
      return currentJob.augmentation;
    }

    return null;
  }

  #getFactionWeight(faction) {
    let weight = 1;
    if (faction === this.#EXIT_FACTION) {
      weight = 10;
    } else if (this.#EXTRA_SPECIAL_FACTIONS.includes(faction)) {
      weight = 5;
    } else if (this.#SPECIAL_FACTIONS.includes(faction)) {
      weight = 2;
    }
    return weight;
  }

  // when getting an invite from CSEC, NiteSEC, etc, accept it automatically
  // prioritize CSEC, NiteSEC, etc when switching factions

  #log(...args) {
    utilLog('faction', ...args);
  }
}
