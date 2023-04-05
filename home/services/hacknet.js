import {
  log as utilLog,
  ACTIONS,
  HACKNET_UPGRADE_TYPES,
  hasFormulas,
  logEventHandler
} from 'utils.js';
import { CorpService } from 'services/corp.js';

// TODO make this factor in not only which is cheaper but which upgrade gives the most increase in money

export class HacknetService {
  /**
   * @param {import("..").NS } ns
   * @param {import("..").ScriptHandler} eventHandler
   */
  constructor(ns, eventHandler = logEventHandler) {
    this.ns = ns;

    this.eventHandler = eventHandler;

    this.corpService = new CorpService(ns);
  }

  purchaseUpgradeOrNode() {
    const next = this.#getNextNodeUpgrade();
    if (!next) {
      const nodeCost = this.ns.hacknet.getPurchaseNodeCost();
      const currentMoney = this.ns.getPlayer().money;

      if (
        nodeCost <= currentMoney &&
        this.ns.hacknet.numNodes() !== this.ns.hacknet.maxNumNodes()
      ) {
        this.#log(`Buying new node for ${nodeCost}`);
        const newIndex = this.ns.hacknet.purchaseNode();
        const newStats = this.ns.hacknet.getNodeStats(newIndex);
        const currentAction = {
          action: ACTIONS.BUY,
          type: HACKNET_UPGRADE_TYPES.BUY,
          name: newStats.name,
          cost: nodeCost
        };
        this.eventHandler(currentAction);
      }
    } else {
      this.#log(`(${next.name}) Upgrading ${next.upgrade}`);
      const success = this.#processUpgrade(next);
      if (success) {
        const currentAction = {
          action: ACTIONS.UPGRADE,
          type: next.upgrade,
          name: next.name,
          cost: next.cost
        };
        this.eventHandler(currentAction);
        this.#log(`(${next.name}) Successfully upgraded ${next.upgrade}`);
      } else {
        this.#log(`(${next.name}) Failed to upgrade ${next.upgrade}`);
      }
    }
  }

  spendHashes() {
    const nextUpgrade = this.#getNextHashUpgrade();

    if (nextUpgrade) {
      // process upgrade
      this.ns.hacknet.spendHashes(nextUpgrade.name, nextUpgrade.target, 1);
      this.eventHandler({
        action: ACTIONS.SERVER,
        type: 'Hash Upgrade',
        name: nextUpgrade.name,
        cost: nextUpgrade.cost
      });
    }
  }

  #getNextHashUpgrade() {
    const currentHashes = this.ns.hacknet.numHashes();
    const hashUpgradeInfo = this.ns.hacknet.getHashUpgrades().map(upgradeName => {
      const weight = upgradeName.includes('Corporation') ? 10 : 1;
      return {
        name: upgradeName,
        target: '',
        cost: this.ns.hacknet.hashCost(upgradeName, 1),
        weight: weight
      };
    });
    // filtering out some of these for now until I figure out more sophisticated logic or unlock the feature
    const filteredHashUpgrades = hashUpgradeInfo.filter(upgradeInfo => {
      const isBladerunner = upgradeInfo.name.includes('Bladeburner');
      const isTraining = upgradeInfo.name.includes('Improve');
      const isHackingSkill =
        upgradeInfo.name.includes('Reduce') || upgradeInfo.name.includes('Increase');
      const isCodingContract = upgradeInfo.name.includes('Generate');

      const isUnconfiguredType = isBladerunner || isTraining || isHackingSkill || isCodingContract;

      const hasCorp = this.corpService.hasCorp();
      const hasAllResearch = this.corpService.hasAllResearch();
      const isCorpUpgrade = upgradeInfo.name.includes('Corporation');

      if (isCorpUpgrade && !hasCorp) {
        return false;
      }

      // if we have all the research, we don't need to exchange for more corp research anymore
      if (isCorpUpgrade && hasAllResearch && upgradeInfo.name.includes('Research')) {
        return false;
      }

      return !isUnconfiguredType;
    });

    const affordableHashUpgrades = filteredHashUpgrades.filter(
      upgrade => upgrade.cost <= currentHashes
    );

    // first by weight descending, then by cost descending
    const sortedHashUpgrades = affordableHashUpgrades.sort((a, b) => {
      if (a.weight === b.weight) {
        return b.cost - a.cost;
      }
      return b.weight - a.weight;
    });

    if (sortedHashUpgrades.length === 0) {
      return null;
    }

    return sortedHashUpgrades[0];
  }

  isHacknetServers() {
    return this.ns.hacknet.numNodes() !== 0 && this.ns.hacknet.getNodeStats(0).cache !== undefined;
  }

  getHacknetIncome() {
    const numHackNetNodes = this.ns.hacknet.numNodes();
    let hacknetProductionRaw = 0;
    for (let i = 0; i < numHackNetNodes; i++) {
      const node = this.ns.hacknet.getNodeStats(i);
      hacknetProductionRaw += node.production;
    }
    return this.ns.formatNumber(hacknetProductionRaw, 2);
  }

  #getNextNodeUpgrade() {
    const nodeCount = this.ns.hacknet.numNodes();
    const nodes = [...new Array(nodeCount)].map((_, index) => {
      const nodeInfo = this.ns.hacknet.getNodeStats(index);
      const level = {
        current: nodeInfo.level,
        upgradeCost: this.ns.hacknet.getLevelUpgradeCost(index, 1)
      };
      const ram = {
        current: nodeInfo.ram,
        upgradeCost: this.ns.hacknet.getRamUpgradeCost(index, 1)
      };
      const cores = {
        current: nodeInfo.cores,
        upgradeCost: this.ns.hacknet.getCoreUpgradeCost(index, 1)
      };
      const hasCache = nodeInfo.cache !== undefined;
      const cache = {
        current: nodeInfo.cache,
        upgradeCost: this.ns.hacknet.getCacheUpgradeCost(index, 1)
      };

      return {
        ...nodeInfo,
        level,
        ram,
        cores,
        cache: hasCache ? cache : undefined,
        index
      };
    });

    const currentMoney = this.ns.getPlayer().money;
    const potentialUpgrades = nodes.reduce((items, node) => {
      if (node.level.current < this.#getMaxLevel()) {
        if (node.level.upgradeCost <= currentMoney) {
          items = [
            ...items,
            {
              upgrade: HACKNET_UPGRADE_TYPES.LEVEL,
              index: node.index,
              cost: node.level.upgradeCost,
              name: node.name
            }
          ];
        }
      }

      if (node.ram.current < this.#getMaxRam()) {
        if (node.ram.upgradeCost <= currentMoney) {
          items = [
            ...items,
            {
              upgrade: HACKNET_UPGRADE_TYPES.RAM,
              index: node.index,
              cost: node.ram.upgradeCost,
              name: node.name
            }
          ];
        }
      }

      if (node.cores.current < this.#getMaxCores()) {
        if (node.cores.upgradeCost <= currentMoney) {
          items = [
            ...items,
            {
              upgrade: HACKNET_UPGRADE_TYPES.CORES,
              index: node.index,
              cost: node.cores.upgradeCost,
              name: node.name
            }
          ];
        }
      }

      const maxCache = this.#getMaxCache();
      if (node.cache && maxCache && node.cache.current < maxCache) {
        if (node.cache.upgradeCost <= currentMoney) {
          items = [
            ...items,
            {
              upgrade: HACKNET_UPGRADE_TYPES.CACHE,
              index: node.index,
              cost: node.cache.upgradeCost,
              name: node.name
            }
          ];
        }
      }

      return items;
    }, []);

    if (potentialUpgrades.length === 0) {
      return null;
    }

    this.#log(`Found ${potentialUpgrades.length} potential upgrades`);
    const sortedPotentialUpgrades = potentialUpgrades.sort((a, b) => a.cost - b.cost);

    return sortedPotentialUpgrades[0];
  }

  #processUpgrade(next) {
    switch (next.upgrade) {
      case HACKNET_UPGRADE_TYPES.LEVEL: {
        return this.ns.hacknet.upgradeLevel(next.index, 1);
      }
      case HACKNET_UPGRADE_TYPES.RAM: {
        return this.ns.hacknet.upgradeRam(next.index, 1);
      }
      case HACKNET_UPGRADE_TYPES.CORES: {
        return this.ns.hacknet.upgradeCore(next.index, 1);
      }
      case HACKNET_UPGRADE_TYPES.CACHE: {
        return this.ns.hacknet.upgradeCache(next.index, 1);
      }
      default: {
        return false;
      }
    }
  }

  #getMaxLevel() {
    return this.#getHacknetConstant('MaxLevel', 200);
  }

  #getMaxRam() {
    return this.#getHacknetConstant('MaxRam', 64);
  }

  #getMaxCores() {
    return this.#getHacknetConstant('MaxCores', 16);
  }

  #getMaxCache() {
    return this.#getHacknetConstant('MaxCache', 15);
  }

  #getHacknetConstant(valueField, noFormulasDefault) {
    if (!hasFormulas(this.ns)) {
      return noFormulasDefault;
    }

    if (this.isHacknetServers()) {
      return this.ns.formulas.hacknetServers.constants()[valueField];
    }

    return this.ns.formulas.hacknetNodes.constants()[valueField];
  }

  #log(...args) {
    utilLog('hacknet', ...args);
  }
}
