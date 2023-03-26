import { ACTIONS, PORT_MAPPING } from 'utils.js';

export class GangService {

  GANG_MEMBER_NAMES = [
    "Razor",
    "Vandal",
    "Spike",
    "Siren",
    "Blaze",
    "Rebel",
    "Ghost",
    "Raven",
    "Fury",
    "Ace",
    "Shadow",
    "Wolf",
    "Nova",
    "Bullet",
    "Storm"
  ];
  WANTED_LEVEL_PENALTY_THRESHOLD = 25;

  /** @param {import("..").NS } ns */
  constructor(ns) {
    this.ns = ns;
    this.gang = this.ns.gang;
  }

  /** @param {import("..").ScriptHandler?} eventHandler */
  handleGang(eventHandler) {
    const taskInfo = this._getTaskInfo();
    const gangMembers = this._getGangMembers();
    const memberUpgradeInfo = this._getMemberUpgradeInfo();

    this._handleAddUpgradeGangMembers(eventHandler, gangMembers, memberUpgradeInfo);

    const gangInfo = this.gang.getGangInformation();
    gangMembers.forEach(gangMember => {
      if (gangInfo.isHacking) {
        // const currentTask = taskInfo.find(task => task.name === gangMember.memberInfo.task);
        // const hasTask = currentTask && currentTask.name !== '' && currentTask.name !== 'Unassigned';
        // const isDoingEthicalHacking = hasTask && currentTask.name === 'Ethical Hacking';
        // const isPhishing = hasTask && currentTask.name === 'Phishing';
        // if (gangInfo.wantedPenalty > this.WANTED_LEVEL_PENALTY_THRESHOLD && !isDoingEthicalHacking) {
        //   this.gang.setMemberTask(gangMember.name, 'Ethical Hacking');
        //   const currentAction = {
        //     action: ACTIONS.TASK,
        //     name: gangMember.name,
        //     type: 'Ethical Hacking'
        //   };
        //   eventHandler && eventHandler(currentAction);
        // } else if (!isPhishing) {
        //   this.gang.setMemberTask(gangMember.name, 'Phishing');
        //   const currentAction = {
        //     action: ACTIONS.TASK,
        //     name: gangMember.name,
        //     type: 'Phishing'
        //   };
        //   eventHandler && eventHandler(currentAction);
        // }
      } else {
        // stuff for combat gangs
      }
    });
  }

  hasGang() {
    return this.gang.inGang();
  }

  _handleAddUpgradeGangMembers(eventHandler, gangMembers, memberUpgradeInfo) {
    if (this.gang.canRecruitMember()) {
      this.gang.recruitMember(this._getNextGangMemberName());
    }

    // we need to rethink a bit
    // this is getting stuck in an infinite loop because we will ascend a member, then do all their upgrades, then check if there's any members to ascend, find that member, and repeat
    // instead we need to one ascend, then do all their upgrades, then check if we should ascend again - we'll need another port to track this similar to the "num times to upgrade" env we were playing with before

    const gangMembersWhoCanAscend = gangMembers.filter(gangMember => gangMember.canAscend);
    gangMembersWhoCanAscend.forEach(gangMember => {
      this.gang.ascendMember(gangMember.name);
      const currentAction = {
        action: ACTIONS.ASCEND,
        name: gangMember.name
      };
      eventHandler && eventHandler(currentAction);
    });

    let nextUpgrade = this._getNextUpgrade(gangMembers, memberUpgradeInfo);
    if (nextUpgrade) {
      this.gang.purchaseEquipment(nextUpgrade.memberName, nextUpgrade.name);
      const currentAction = {
        action: ACTIONS.UPGRADE,
        type: nextUpgrade.name,
        name: nextUpgrade.memberName,
        cost: nextUpgrade.cost,
      };
      eventHandler && eventHandler(currentAction);
    }
  }

  _getNextUpgrade(gangMembers, memberUpgradeInfo) {
    const availableGangMemberUpgrades = gangMembers.reduce((upgrades, gangMember) => {
      const memberUpgrades = gangMember.memberInfo.upgrades.concat(gangMember.memberInfo.augmentations);
      const memberUpgradesByPrice = memberUpgradeInfo.filter(info => !memberUpgrades.includes(info.name));
      const upgradeData = memberUpgradesByPrice.map(upgrade => {
        return {
          name: upgrade.name,
          cost: upgrade.cost,
          type: upgrade.type,
          stats: upgrade.stats,
          memberName: gangMember.name
        };
      });
      const currentMoney = this.ns.getPlayer().money;
      const affordableUpgrades = upgradeData.filter(upgrade => upgrade.cost <= currentMoney);

      return [...upgrades, ...affordableUpgrades];
    }, []).sort((a, b) => a.cost - b.cost);

    if (availableGangMemberUpgrades.length === 0) {
      return null;
    }

    return availableGangMemberUpgrades[0];
  }

  _getGangMembers() {
    return this.gang.getMemberNames().map(name => {
      const memberInfo = this.gang.getMemberInformation(name);
      const canAscend = this.gang.getAscensionResult(name) !== undefined;

      return {
        memberInfo,
        name,
        canAscend
      };
    });
  }

  _getNextGangMemberName() {
    const gangMemberNames = this.gang.getMemberNames();

    const randomName = this.GANG_MEMBER_NAMES[Math.floor(Math.random() * this.GANG_MEMBER_NAMES.length)];
    const randomName2 = this.GANG_MEMBER_NAMES[Math.floor(Math.random() * this.GANG_MEMBER_NAMES.length)];
    const newName = `${randomName} ${randomName2}`;

    if (gangMemberNames.includes(newName)) {
      return this._getNextGangMemberName();
    }

    return newName;
  }

  _getMemberUpgradeInfo() {
    return this.gang.getEquipmentNames().map(name => {
      const cost = this.gang.getEquipmentCost(name);
      const stats = this.gang.getEquipmentStats(name);
      const type = this.gang.getEquipmentType(name);

      return {
        name,
        cost,
        stats,
        type
      };
    });
  }

  _getTaskInfo() {
    return this.gang.getTaskNames().map(name => {
      const stats = this.gang.getTaskStats(name);

      return {
        name,
        stats
      };
    });
  }

}