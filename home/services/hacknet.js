import { log as utilLog, ACTIONS, HACKNET_UPGRADE_TYPES, hasFormulas } from 'utils.js';

// TODO make this factor in not only which is cheaper but which upgrade gives the most increase in money

export class HacknetService {
  /** @param {import("..").NS } ns */
  constructor(ns) {
    this.ns = ns;
  }

  /** @param {import("..").ScriptHandler?} eventHandler */
  purchaseUpgradeOrNode(eventHandler) {
    const next = this._getNextUpgrade();
    if (!next) {
      const nodeCost = this.ns.hacknet.getPurchaseNodeCost();
      const currentMoney = this.ns.getPlayer().money;

      if (
        nodeCost <= currentMoney &&
        this.ns.hacknet.numNodes() !== this.ns.hacknet.maxNumNodes()
      ) {
        this._log(`Buying new node for ${nodeCost}`);
        const newIndex = this.ns.hacknet.purchaseNode();
        const newStats = this.ns.hacknet.getNodeStats(newIndex);
        const currentAction = {
          action: ACTIONS.BUY,
          type: HACKNET_UPGRADE_TYPES.BUY,
          name: newStats.name,
          cost: nodeCost
        };
        eventHandler && eventHandler(currentAction);
      }
    } else {
      this._log(`(${next.name}) Upgrading ${next.upgrade}`);
      const success = this._processUpgrade(next);
      if (success) {
        const currentAction = {
          action: ACTIONS.UPGRADE,
          type: next.upgrade,
          name: next.name,
          cost: next.cost
        };
        eventHandler && eventHandler(currentAction);
        this._log(`(${next.name}) Successfully upgraded ${next.upgrade}`);
      } else {
        this._log(`(${next.name}) Failed to upgrade ${next.upgrade}`);
      }
    }
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

  _getNextUpgrade() {
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
        level: level,
        ram: ram,
        cores: cores,
        cache: hasCache ? cache : undefined,
        index
      };
    });

    const currentMoney = this.ns.getPlayer().money;
    const potentialUpgrades = nodes.reduce((items, node) => {
      if (node.level.current < this._getMaxLevel()) {
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

      if (node.ram.current < this._getMaxRam()) {
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

      if (node.cores.current < this._getMaxCores()) {
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

      const maxCache = this._getMaxCache();
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

    this._log(`Found ${potentialUpgrades.length} potential upgrades`);
    const sortedPotentialUpgrades = potentialUpgrades.sort((a, b) => a.cost - b.cost);

    return sortedPotentialUpgrades[0];
  }

  _processUpgrade(next) {
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

  _getMaxLevel() {
    return this._getHacknetConstant('MaxLevel', 200);
  }

  _getMaxRam() {
    return this._getHacknetConstant('MaxRam', 64);
  }

  _getMaxCores() {
    return this._getHacknetConstant('MaxCores', 16);
  }

  _getMaxCache() {
    return this._getHacknetConstant('MaxCache', 15);
  }

  _getHacknetConstant(valueField, noFormulasDefault) {
    if (!hasFormulas(this.ns)) {
      return noFormulasDefault;
    }

    if (this.isHacknetServers()) {
      return this.ns.formulas.hacknetServers.constants()[valueField];
    }

    return this.ns.formulas.hacknetNodes.constants()[valueField];
  }

  _log(...args) {
    utilLog('hacknet', ...args);
  }
}
