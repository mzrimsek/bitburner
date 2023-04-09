import {
  log as utilLog,
  STARTUP_SCRIPTS,
  ACTIONS,
  logEventHandler,
  hasFileOnHome,
  connectTo
} from 'utils.js';

import { EnvService } from 'services/env.js';

export class AttackService {
  #hackSource = 'home';
  #excludedServers = [this.#hackSource];
  #hackFile = '/basic/hack.js';
  #weakenFile = '/basic/weaken.js';
  #growFile = '/basic/grow.js';

  /**
   * @param {import("..").NS } ns
   * @param {import("..").ScriptHandler} eventHandler
   */
  constructor(ns, eventHandler = logEventHandler) {
    this.ns = ns;
    this.eventHandler = eventHandler;

    this.envService = new EnvService(ns, eventHandler);
  }

  async initiateAttack() {
    const children = this.#getChildren(this.#hackSource);
    const serverNames = this.#getServerNames(this.#hackSource, children).filter(
      serverName => !this.#excludedServers.includes(serverName)
    );

    await this.#openServers(serverNames);
    const hackableServerNames = await this.#getHackableServerNames(serverNames);
    const ownedServerNames = await this.#getOwnedServerNames();
    const allServerNames = [...hackableServerNames, ...ownedServerNames];
    const distinctServerNames = [...new Set(allServerNames)];
    // TODO possibly make hacking from the hacknet servers be an env to toggle
    // would need to make sure that after toggling off, all scripts on the hacknet servers are killed
    const nonHacknetServerNames = distinctServerNames.filter(
      serverName => !serverName.includes('hacknet')
    );
    await this.#coordinateAttack(nonHacknetServerNames);
  }

  /**
   *  @param {Server} server
   */
  async openServer(server, returnTo = this.#hackSource) {
    const hasSshHack = hasFileOnHome(this.ns, 'BruteSSH.exe');
    if (!server.sshPortOpen && hasSshHack) {
      this.#log(server.hostname, 'Opening SSH port');
      this.ns.brutessh(server.hostname);
    }

    const hasFtpHack = hasFileOnHome(this.ns, 'FTPCrack.exe');
    if (!server.ftpPortOpen && hasFtpHack) {
      this.#log(server.hostname, 'Opening FTP port');
      this.ns.ftpcrack(server.hostname);
    }

    const hasSmtpHack = hasFileOnHome(this.ns, 'relaySMTP.exe');
    if (!server.smtpPortOpen && hasSmtpHack) {
      this.#log(server.hostname, 'Opening SMTP port');
      this.ns.relaysmtp(server.hostname);
    }

    const hasHttpHack = hasFileOnHome(this.ns, 'HTTPWorm.exe');
    if (!server.httpPortOpen && hasHttpHack) {
      this.#log(server.hostname, 'Opening HTTP port');
      this.ns.httpworm(server.hostname);
    }

    const hasSqlHack = hasFileOnHome(this.ns, 'SQLInject.exe');
    if (!server.sqlPortOpen && hasSqlHack) {
      this.#log(server.hostname, 'Opening SQL port');
      this.ns.sqlinject(server.hostname);
    }

    // get admin access
    const hasNukeHack = hasFileOnHome(this.ns, 'NUKE.exe');
    if (
      !server.hasAdminRights &&
      hasNukeHack &&
      server.numOpenPortsRequired <= server.openPortCount
    ) {
      this.#log(server.hostname, 'Getting root access');
      this.ns.nuke(server.hostname);
    }

    const canHackTarget =
      this.ns.getHackingLevel() >= this.ns.getServerRequiredHackingLevel(server.hostname);
    const canBackdoor =
      this.envService.hasSingularity() && this.ns.hasRootAccess(server.hostname) && canHackTarget;
    if (canBackdoor && !server.backdoorInstalled) {
      // connectTo(this.ns, server.hostname); // figure out why awaiting here doesn't seem to work?
      // await this.ns.singularity.installBackdoor();
      // connectTo(this.ns, returnTo);
    }
  }

  /**
   *  @param {string[]} hackableServerNames
   */
  async #coordinateAttack(hackableServerNames) {
    const target = this.#getTargetServer(hackableServerNames);
    this.#log(`${target} identified`);

    const moneyThreshhold = this.ns.getServerMaxMoney(target) * 0.9;
    const securityThreshhold = this.ns.getServerMinSecurityLevel(target) + 5;

    const numTimesToHack = 2.05;

    const securityLevel = this.ns.getServerSecurityLevel(target);
    const availableMoney = this.ns.getServerMoneyAvailable(target);
    if (securityLevel > securityThreshhold) {
      this.#log(`${target} weakening`);
      for (const serverName of hackableServerNames) {
        this.#killScripts(serverName);
        const freeRam = this.#getFreeRam(serverName);
        const ramToWeaken = this.ns.getScriptRam(this.#weakenFile, this.#hackSource);
        const numThreads = Math.floor(freeRam / ramToWeaken);
        if (numThreads > 0) {
          if (!this.ns.fileExists(this.#weakenFile, serverName)) {
            this.ns.scp(this.#weakenFile, serverName, this.#hackSource);
          }
          this.ns.exec(this.#weakenFile, serverName, numThreads, target);
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
      this.eventHandler(currentAction);
      await this.ns.sleep(duration);
    } else if (availableMoney < moneyThreshhold) {
      this.#log(`${target} growing`);
      for (const serverName of hackableServerNames) {
        this.#killScripts(serverName);
        const freeRam = this.#getFreeRam(serverName);
        const ramToGrow = this.ns.getScriptRam(this.#growFile, this.#hackSource);
        const numThreads = Math.floor(freeRam / ramToGrow);
        if (numThreads > 0) {
          if (!this.ns.fileExists(this.#growFile, serverName)) {
            this.ns.scp(this.#growFile, serverName, this.#hackSource);
          }
          this.ns.exec(this.#growFile, serverName, numThreads, target);
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
      this.eventHandler(currentAction);
      await this.ns.sleep(duration);
    } else {
      this.#log(`${target} hacking`);
      for (const serverName of hackableServerNames) {
        this.#killScripts(serverName);
        const freeRam = this.#getFreeRam(serverName);
        const ramToHack = this.ns.getScriptRam(this.#hackFile, this.#hackSource);
        const numThreads = Math.floor(freeRam / ramToHack);
        if (numThreads > 0) {
          if (!this.ns.fileExists(this.#hackFile, serverName)) {
            this.ns.scp(this.#hackFile, serverName, this.#hackSource);
          }
          this.ns.exec(this.#hackFile, serverName, numThreads, target);
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
      this.eventHandler(currentAction);
      await this.ns.sleep(duration);
    }
  }

  /**
   *  @param {string[]} hackableServernames
   */
  #getTargetServer(hackableServernames) {
    let target = 'n00dles';
    let optimalVal = 0;
    let currVal;
    let currTime;

    for (const serverName of hackableServernames) {
      currVal = this.ns.getServerMaxMoney(serverName);
      currTime =
        this.ns.getWeakenTime(serverName) +
        this.ns.getGrowTime(serverName) +
        this.ns.getHackTime(serverName);
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
  async #getHackableServerNames(allServerNames) {
    const servers = await this.#getServers(allServerNames);
    const hackableServerNames = servers
      .filter(server => {
        const hackingLevel = this.ns.getHackingLevel();
        const requiredHackingLevel = this.ns.getServerRequiredHackingLevel(server.hostname);
        return (
          server.hasAdminRights &&
          requiredHackingLevel <= hackingLevel &&
          server.numOpenPortsRequired <= server.openPortCount
        );
      })
      .map(server => server.hostname);
    const allNames = [this.#hackSource, ...hackableServerNames];
    return [...new Set(allNames)];
  }

  async #getOwnedServerNames() {
    const local = this.ns.scan(this.#hackSource);
    const servers = await this.#getServers(local);
    return servers.filter(server => server.purchasedByPlayer).map(server => server.hostname);
  }

  /**
   *  @param {string[]} serverNames
   */
  async #openServers(serverNames) {
    this.#log('opening servers...');
    const servers = await this.#getServers(serverNames);
    servers.forEach(async server => await this.openServer(server));
  }

  /**
   *  @param {string} host
   *  @param {string} parent
   *  @param {string[]} list
   */
  #getServerNames(host, children, list = []) {
    children.forEach(child => {
      const nextChildren = this.#getChildren(child, host);
      this.#getServerNames(child, nextChildren, list);
    });

    list.push(host);
    return list;
  }

  /**
   *  @param {string} host
   *  @param {string} parent
   */
  #getChildren(host, parent) {
    return this.ns.scan(host).filter(child => {
      const isExcluded = this.#excludedServers.includes(child);
      const isParent = parent && child === parent;
      return !isExcluded && !isParent;
    });
  }

  /**
   *  @param {string[]} serverNames
   */
  async #getServers(serverNames) {
    return serverNames.map(serverName => this.ns.getServer(serverName));
  }

  /**
   *  @param {string} serverName
   */
  #getFreeRam(serverName) {
    return serverName === this.#hackSource
      ? this.#getHackSourceFreeRam()
      : this.#getServerFreeRam(serverName);
  }

  /**
   *  @param {string} serverName
   */
  #getServerFreeRam(serverName) {
    return this.ns.getServerMaxRam(serverName) - this.ns.getServerUsedRam(serverName);
  }

  #getHackSourceFreeRam() {
    const freeRam = this.#getServerFreeRam(this.#hackSource);
    const specialRam = STARTUP_SCRIPTS.reduce((totalRam, script) => {
      const cost = this.ns.getScriptRam(script, this.#hackSource);
      return totalRam + cost;
    }, 0);
    return freeRam - specialRam;
  }

  /**
   *  @param {string} serverName
   */
  #killScripts(serverName) {
    if (serverName !== this.#hackSource) {
      this.ns.killall(serverName, true);
    } else {
      const runningScripts = this.ns.ps(serverName).map(process => process.filename);
      const scriptsToKill = runningScripts.filter(script => !STARTUP_SCRIPTS.includes(script));
      for (const scriptToKill of scriptsToKill) {
        this.ns.scriptKill(scriptToKill, serverName);
      }
    }
  }

  #log(...args) {
    utilLog('hack', ...args);
  }
}
