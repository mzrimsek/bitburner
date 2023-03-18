import { log as utilLog, STARTUP_SCRIPTS, ACTIONS } from 'utils.js';

export class AttackService {

  hackSource = 'home';
  excludedServers = [this.hackSource];
  hackFile = '/basic/hack.js';
  weakenFile = '/basic/weaken.js';
  growFile = '/basic/grow.js';

  /** @param {import("..").NS } ns */
  constructor(ns) {
    this.ns = ns;
  }

  async initiateAttack(eventHandler) {
    const children = this._getChildren(this.hackSource);
    const serverNames = this._getServerNames(this.hackSource, children).filter(serverName => !this.excludedServers.includes(serverName));

    await this._openServers(serverNames);
    const hackableServerNames = await this._getHackableServerNames(serverNames);
    const ownedServerNames = await this._getOwnedServerNames();
    const allServerNamesToAttackFrom = [...hackableServerNames, ...ownedServerNames];
    await this._coordinateAttack(allServerNamesToAttackFrom, eventHandler);
  }

  /**
 *  @param {string[]} hackableServerNames
 */
  async _coordinateAttack(hackableServerNames, eventHandler) {
    const target = this._getTargetServer(hackableServerNames);
    this._log(`${target} identified`);

    const moneyThreshhold = this.ns.getServerMaxMoney(target) * .9;
    const securityThreshhold = this.ns.getServerMinSecurityLevel(target) + 5;

    const numTimesToHack = 2.05;

    const securityLevel = this.ns.getServerSecurityLevel(target);
    const availableMoney = this.ns.getServerMoneyAvailable(target);
    if (securityLevel > securityThreshhold) {
      this._log(`${target} weakening`);
      for (const serverName of hackableServerNames) {
        this._killScripts(serverName);
        const freeRam = this._getFreeRam(serverName);
        const ramToWeaken = this.ns.getScriptRam(this.weakenFile, this.hackSource);
        const numThreads = Math.floor(freeRam / ramToWeaken);
        if (numThreads > 0) {
          if (!this.ns.fileExists(this.weakenFile, serverName)) {
            this.ns.scp(this.weakenFile, serverName, this.hackSource);
          }
          this.ns.exec(this.weakenFile, serverName, numThreads, target);
        }
      }
      const duration = numTimesToHack * this.ns.getWeakenTime(target) + 300;
      const currentAction = {
        action: ACTIONS.WEAKEN,
        name: target,
        attackers: hackableServerNames.length,
        threshold: securityThreshhold,
        amount: numTimesToHack,
        duration: Math.floor(duration / 1000)
      };
      eventHandler && eventHandler(currentAction);
      await this.ns.sleep(duration);
    } else if (availableMoney < moneyThreshhold) {
      this._log(`${target} growing`);
      for (const serverName of hackableServerNames) {
        this._killScripts(serverName);
        const freeRam = this._getFreeRam(serverName);
        const ramToGrow = this.ns.getScriptRam(this.growFile, this.hackSource);
        const numThreads = Math.floor(freeRam / ramToGrow);
        if (numThreads > 0) {
          if (!this.ns.fileExists(this.growFile, serverName)) {
            this.ns.scp(this.growFile, serverName, this.hackSource);
          }
          this.ns.exec(this.growFile, serverName, numThreads, target);
        }
      }
      const duration = numTimesToHack * this.ns.getGrowTime(target) + 300;
      const currentAction = {
        action: ACTIONS.GROW,
        name: target,
        attackers: hackableServerNames.length,
        threshold: securityThreshhold,
        amount: numTimesToHack,
        duration: Math.floor(duration / 1000)
      };
      eventHandler && eventHandler(currentAction);
      await this.ns.sleep(duration);
    } else {
      this._log(`${target} hacking`);
      for (const serverName of hackableServerNames) {
        this._killScripts(serverName);
        const freeRam = this._getFreeRam(serverName);
        const ramToHack = this.ns.getScriptRam(this.hackFile, this.hackSource);
        const numThreads = Math.floor(freeRam / ramToHack);
        if (numThreads > 0) {
          if (!this.ns.fileExists(this.hackFile, serverName)) {
            this.ns.scp(this.hackFile, serverName, this.hackSource);
          }
          this.ns.exec(this.hackFile, serverName, numThreads, target);
        }
      }
      const duration = numTimesToHack * this.ns.getHackTime(target) + 300;
      const currentAction = {
        action: ACTIONS.HACK,
        name: target,
        attackers: hackableServerNames.length,
        threshold: securityThreshhold,
        amount: numTimesToHack,
        duration: Math.floor(duration / 1000)
      };
      eventHandler && eventHandler(currentAction);
      await this.ns.sleep(duration);
    }
  }

  /**
   *  @param {string[]} hackableServernames
   */
  _getTargetServer(hackableServernames) {
    let target = 'n00dles';
    let optimalVal = 0;
    let currVal;
    let currTime;

    for (const serverName of hackableServernames) {
      currVal = this.ns.getServerMaxMoney(serverName);
      currTime = this.ns.getWeakenTime(serverName) + this.ns.getGrowTime(serverName) + this.ns.getHackTime(serverName);
      currVal /= currTime;
      if (currVal >= optimalVal) {
        optimalVal = currVal;
        target = serverName;
      }
    }

    return target;
  }

  /**
   *  @param {string[]} serverNames
   */
  async _getHackableServerNames(allServerNames) {
    const servers = await this._getServers(allServerNames);
    const hackableServerNames = servers.filter(server => {
      const hackingLevel = this.ns.getHackingLevel();
      const requiredHackingLevel = this.ns.getServerRequiredHackingLevel(server.hostname);
      return server.hasAdminRights && requiredHackingLevel <= hackingLevel && server.numOpenPortsRequired <= server.openPortCount;
    }).map(server => server.hostname);
    const allNames = [this.hackSource, ...hackableServerNames];
    return [...new Set(allNames)];
  }

  async _getOwnedServerNames() {
    const local = this.ns.scan(this.hackSource);
    const servers = await this._getServers(local);
    return servers.filter(server => server.purchasedByPlayer).map(server => server.hostname);
  }

  /**
   *  @param {string[]} serverNames
   */
  async _openServers(serverNames) {
    this._log('opening servers...');
    const servers = await this._getServers(serverNames);
    servers.forEach(async (server) => await this._openServer(server));
  }

  /**
   *  @param {Server} server
   */
  async _openServer(server) {
    const hasSshHack = this.ns.fileExists('BruteSSH.exe', this.hackSource);
    if (!server.sshPortOpen && hasSshHack) {
      this._log(server.hostname, 'Opening SSH port');
      this.ns.brutessh(server.hostname);
    }

    const hasFtpHack = this.ns.fileExists('FTPCrack.exe', this.hackSource);
    if (!server.ftpPortOpen && hasFtpHack) {
      this._log(server.hostname, 'Opening FTP port');
      this.ns.ftpcrack(server.hostname);
    }

    const hasSmtpHack = this.ns.fileExists('relaySMTP.exe', this.hackSource);
    if (!server.smtpPortOpen && hasSmtpHack) {
      this._log(server.hostname, 'Opening SMTP port');
      this.ns.relaysmtp(server.hostname);
    }

    const hasHttpHack = this.ns.fileExists('HTTPWorm.exe', this.hackSource);
    if (!server.httpPortOpen && hasHttpHack) {
      this._log(server.hostname, 'Opening HTTP port');
      this.ns.httpworm(server.hostname);
    }

    const hasSqlHack = this.ns.fileExists('SQLInject.exe', this.hackSource);
    if (!server.sqlPortOpen && hasSqlHack) {
      this._log(server.hostname, 'Opening SQL port');
      this.ns.sqlinject(server.hostname);
    }

    // get admin access
    const hasNukeHack = this.ns.fileExists('NUKE.exe', this.hackSource);
    if (!server.hasAdminRights && hasNukeHack && server.numOpenPortsRequired <= server.openPortCount) {
      this._log(server.hostname, 'Getting root access');
      this.ns.nuke(server.hostname);
    }

    // install backdoor
    if (server.hasAdminRights && !server.backdoorInstalled) {
      // install backdoor later
    }
  }

  /**
   *  @param {string} host
   *  @param {string} parent
   *  @param {string[]} list
   */
  _getServerNames(host, children, list = []) {
    children.forEach(child => {
      const nextChildren = this._getChildren(child, host);
      this._getServerNames(child, nextChildren, list);
    });

    list.push(host);
    return list;
  }

  /**
   *  @param {string} host
   *  @param {string} parent
   */
  _getChildren(host, parent) {
    return this.ns.scan(host).filter(child => {
      const isExcluded = this.excludedServers.includes(child);
      const isParent = parent && child === parent;
      return !isExcluded && !isParent;
    })
  }

  /**
   *  @param {string[]} serverNames
   */
  async _getServers(serverNames) {
    return serverNames.map(serverName => this.ns.getServer(serverName));
  }

  /**
   *  @param {string} serverName
   */
  _getFreeRam(serverName) {
    return serverName === this.hackSource ? this._getHackSourceFreeRam() : this._getServerFreeRam(serverName);
  }

  /** 
   *  @param {string} serverName
   */
  _getServerFreeRam(serverName) {
    return this.ns.getServerMaxRam(serverName) - this.ns.getServerUsedRam(serverName);
  }

  _getHackSourceFreeRam() {
    const freeRam = this._getServerFreeRam(this.hackSource);
    const specialRam = STARTUP_SCRIPTS.reduce((totalRam, script) => {
      const cost = this.ns.getScriptRam(script, this.hackSource);
      return totalRam + cost;
    }, 0);
    return freeRam - specialRam;
  }

  /** 
   *  @param {string} serverName
   */
  _killScripts(serverName) {
    if (serverName !== this.hackSource) {
      this.ns.killall(serverName, true);
    } else {
      const runningScripts = this.ns.ps(serverName).map(process => process.filename);
      const scriptsToKill = runningScripts.filter(script => !STARTUP_SCRIPTS.includes(script));
      for (const scriptToKill of scriptsToKill) {
        this.ns.scriptKill(scriptToKill, serverName);
      }
    }
  }

  _log(...args) {
    utilLog('hack', ...args);
  }
}