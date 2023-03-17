import { log as utilLog } from 'utils.js';

// TODO make this factor in not only which is cheaper but which upgrade gives the most increase in money

export class HacknetService {

  MAX_LEVEL = 200;
  MAX_RAM = 64;
  MAX_CORES = 16;

  /** @param {import("..").NS } ns */
  constructor(ns) {
    this.ns = ns;
  }

  purchaseUpgradeOrNode(eventHandler) {
    const next = this._getNextUpgrade();
    if (!next) {
      const nodeCost = this.ns.hacknet.getPurchaseNodeCost();
      const currentMoney = this.ns.getPlayer().money;

      if (nodeCost <= currentMoney) {
        this._log(`Buying new node for ${nodeCost}`);
        const newIndex = this.ns.hacknet.purchaseNode();
        const newStats = this.ns.hacknet.getNodeStats(newIndex);
        const currentAction = {
          action: 'buy',
          name: newStats.name,
          cost: nodeCost,
          time: new Date()
        };
        eventHandler(currentAction);
      }
    } else {
      this._log(`(${next.name}) Upgrading ${next.upgrade}`);
      const success = this._processUpgrade(next);
      if (success) {
        const currentAction = {
          action: next.upgrade,
          name: next.name,
          cost: next.cost,
          time: new Date()
        };
        eventHandler(currentAction);
        this._log(`(${next.name}) Successfully upgraded ${next.upgrade}`);
      } else {
        this._log(`(${next.name}) Failed to upgrade ${next.upgrade}`);
      }
    }
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

      return {
        ...nodeInfo,
        level: level,
        ram: ram,
        cores: cores,
        index
      };
    });

    const currentMoney = this.ns.getPlayer().money;
    const potentialUpgrades = nodes.reduce((items, node) => {
      if (node.level.current < this.MAX_LEVEL) {
        if (node.level.upgradeCost <= currentMoney) {
          items = [...items, {
            upgrade: 'level',
            index: node.index,
            cost: node.level.upgradeCost,
            name: node.name
          }];
        }
      }

      if (node.ram.current < this.MAX_RAM) {
        if (node.ram.upgradeCost <= currentMoney) {
          items = [...items, {
            upgrade: 'ram',
            index: node.index,
            cost: node.ram.upgradeCost,
            name: node.name
          }];
        }
      }

      if (node.cores.current < this.MAX_CORES) {
        if (node.cores.upgradeCost <= currentMoney) {
          items = [...items, {
            upgrade: 'cores',
            index: node.index,
            cost: node.cores.upgradeCost,
            name: node.name
          }];
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
      case 'level': {
        return this.ns.hacknet.upgradeLevel(next.index, 1);
      }
      case 'ram': {
        return this.ns.hacknet.upgradeRam(next.index, 1);
      }
      case 'cores': {
        return this.ns.hacknet.upgradeCore(next.index, 1);
      }
      default: {
        return false;
      }
    }
  }

  _log(...args) {
    utilLog('hacknet', ...args);
  }
}
