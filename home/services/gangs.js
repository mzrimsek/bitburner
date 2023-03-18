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
  }

  _handleAddUpgradeGangMembers(eventHandler, gangMembers, memberUpgradeInfo) {
    if (this.gang.canRecruitMember()) {
      this.gang.recruitMember(this._getNextGangMemberName());
    }

    const gangMembersWhoCanAscend = gangMembers.filter(gangMember => gangMember.canAscend);
    gangMembersWhoCanAscend.forEach(gangMember => {
      this.gang.ascendMember(gangMember.name);
      const currentAction = {
        action: '👼',
        name: gangMember.name
      };
      eventHandler && eventHandler(currentAction);
    });

    let nextUpgrade = this._getNextUpgrade(gangMembers, memberUpgradeInfo);
    this.gang.purchaseEquipment(nextUpgrade.memberName, nextUpgrade.name);
    const currentAction = {
      action: nextUpgrade.name,
      name: nextUpgrade.memberName,
      cost: nextUpgrade.cost,
    };
    eventHandler && eventHandler(currentAction);
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