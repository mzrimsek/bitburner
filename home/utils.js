export function log(tag, ...args) {
  console.log(`[${tag}] `, ...args);
}

export const STARTUP_SCRIPTS = [
  '/core/dashboard.js',
  '/core/attackServer.js',
  '/core/stonks.js',
  '/monitoring/hud.js',
  '/monitoring/log.js',
  '/monitoring/showEnv.js',
  'infiltration.js'
];

export const DEFAULT_PORT_VALUE = 'NULL PORT DATA';

export const PORT_MAPPING = {
  DO_BUY: 1,
  DO_STONKS: 2,
  DO_GANG: 3,
  DO_GANG_ASCEND: 4,
  DO_CORP_AUTOHIRE: 5,
  DO_CORP_AUTOAD: 6,
  STONKS_LIQUID_CASH_M: 20,
  LOG_FEED: 100
};

export const ACTIONS = {
  BUY: '💰',
  SELL: '💸',
  UPGRADE: '🔩',
  HACK: '🔓',
  WEAKEN: '🔪',
  GROW: '🌱',
  ASCEND: '🚀',
  TASK: '📝',
  SHORT: '📉',
  LONG: '📈',
  SHOCK: '⚡',
  SYNC: '🔄',
  AUGMENT: '🧬',
  SERVER: '🖥️',
  CRIME: '🔫',
  RESEARCH: '🔬',
  EXPAND: '🏗️',
  AD: '📰'
};

export const HACKNET_UPGRADE_TYPES = {
  LEVEL: 'level',
  RAM: 'ram',
  CORES: 'cores',
  BUY: 'buy',
  CACHE: 'cache'
};

export const CORP_OFFICE_UNITS = {
  OPERATIONS: 'Operations', //3
  ENGINEERING: 'Engineer', // 2
  BUSINESS: 'Business', // 2
  MANAGEMENT: 'Management', // 1
  RESEARCH: 'Research & Development', // 1
  TRAINING: 'Training' // 0
};

export const ALL_CITIES = ['Aevum', 'Chongqing', 'Sector-12', 'New Tokyo', 'Ishima', 'Volhaven'];

export function padString(str, targetLength, padStr = ' ') {
  let strCopy = str;

  while (true) {
    if (strCopy.length >= targetLength) {
      return strCopy;
    }
    strCopy = `${padStr}${strCopy}`;
  }
}

export function getFormattedTime(date) {
  const hours = date.getHours();
  const mins = date.getMinutes();
  const secs = date.getSeconds();

  return `${padTimePart(hours)}:${padTimePart(mins)}:${padTimePart(secs)}`;
}

/** @param {number} baseTimeS
 */
export function getFormattedDuration(baseTimeS) {
  if (baseTimeS >= 60) {
    //
    const mins = Math.floor(baseTimeS / 60);
    const secs = baseTimeS - mins * 60;
    return `${mins}min ${secs}s`;
  }

  return `${baseTimeS}s`;
}

/** @param {number} part
 */
function padTimePart(part) {
  return padString(`${part}`, 2, '0');
}

export function getDocument() {
  return eval(`document`);
}

export function initPort(ns, portNum, initValue) {
  ns.clearPort(portNum);
  ns.writePort(portNum, initValue);
}

export function getCycles(rawCycles) {
  const cyclesInt = parseInt(rawCycles);
  if (cyclesInt > 0) {
    return cyclesInt;
  }
  return 0;
}

export function logEventHandler(scriptEvent, ...args) {
  log('logEventHandler', JSON.stringify(scriptEvent), JSON.stringify(args));
}

let lastAttackMessage = '';
/**
 * @param {import(".").NS } ns
 * @param {import(".").ScriptAttackEvent } scriptEvent */
export function logAttack(ns, scriptEvent) {
  const time = scriptEvent?.time || new Date();
  const messageWithoutTime = `${scriptEvent.action} ${scriptEvent.name} from ${
    scriptEvent.attackers
  } for ${getFormattedDuration(scriptEvent.duration)}`;
  const message = `[${getFormattedTime(time)}] ${messageWithoutTime}`;
  if (messageWithoutTime !== lastAttackMessage) {
    ns.writePort(PORT_MAPPING.LOG_FEED, message);
    lastAttackMessage = messageWithoutTime;
  }
}

/**
 * @param {import(".").NS } ns
 * @param {import(".").CustomScriptEvent } scriptEvent */
export function logCustomScriptEvent(ns, scriptEvent) {
  switch (scriptEvent.action) {
    case ACTIONS.BUY: {
      logPurchase(ns, scriptEvent);
      break;
    }
    case ACTIONS.UPGRADE: {
      logCashUpgrade(ns, scriptEvent);
      break;
    }
    case ACTIONS.TASK: {
      logTask(ns, scriptEvent);
      break;
    }
    case ACTIONS.RESEARCH: {
      logNonCashUpgrade(ns, scriptEvent);
      break;
    }
    case ACTIONS.EXPAND: {
      logCashUpgrade(ns, scriptEvent);
      break;
    }
    case ACTIONS.AD: {
      logCashUpgrade(ns, scriptEvent);
      break;
    }
    default: {
      logEvent(ns, scriptEvent);
      break;
    }
  }
}

let lastPurchaseMessage = '';
/**
 * @param {import(".").NS } ns
 * @param {import(".").ScriptPurchaseEvent } scriptEvent */
function logPurchase(ns, scriptEvent) {
  const time = scriptEvent?.time || new Date();
  const cost = scriptEvent?.cost || 0;
  const messageWithoutTime = `($${ns.formatNumber(cost)}) ${scriptEvent.action} ${
    scriptEvent.name
  }`;
  const message = `[${getFormattedTime(time)}] ${messageWithoutTime}`;
  if (messageWithoutTime !== lastPurchaseMessage) {
    ns.writePort(PORT_MAPPING.LOG_FEED, message);
    lastPurchaseMessage = messageWithoutTime;
  }
}

let lastUpgradeMessage = '';
/**
 * @param {import(".").NS } ns
 * @param {import(".").ScriptUpgradeEvent } scriptEvent */
function logCashUpgrade(ns, scriptEvent) {
  const time = scriptEvent?.time || new Date();
  const cost = scriptEvent?.cost || 0;
  const messageWithoutTime = `($${ns.formatNumber(cost)}) ${scriptEvent.action} ${
    scriptEvent.type
  } ${scriptEvent.name}`;
  const message = `[${getFormattedTime(time)}] ${messageWithoutTime}`;
  if (messageWithoutTime !== lastUpgradeMessage) {
    ns.writePort(PORT_MAPPING.LOG_FEED, message);
    lastUpgradeMessage = messageWithoutTime;
  }
}

let lastResearchMessage = '';
/**
 * @param {import(".").NS } ns
 * @param {import(".").ScriptUpgradeEvent } scriptEvent */
function logNonCashUpgrade(ns, scriptEvent) {
  const time = scriptEvent?.time || new Date();
  const cost = scriptEvent?.cost || 0;
  const messageWithoutTime = `(${cost}) ${scriptEvent.action} ${scriptEvent.type} ${scriptEvent.name}`;
  const message = `[${getFormattedTime(time)}] ${messageWithoutTime}`;
  if (messageWithoutTime !== lastResearchMessage) {
    ns.writePort(PORT_MAPPING.LOG_FEED, message);
    lastResearchMessage = messageWithoutTime;
  }
}

let lastTaskMessage = '';
/**
 * @param {import(".").NS } ns
 * @param {import(".").ScriptTaskEvent } scriptEvent */
function logTask(ns, scriptEvent) {
  const time = scriptEvent?.time || new Date();
  const messageWithoutTime = `${scriptEvent.action} ${scriptEvent.name} to ${scriptEvent.task}`;
  const message = `[${getFormattedTime(time)}] ${messageWithoutTime}`;
  if (messageWithoutTime !== lastTaskMessage) {
    ns.writePort(PORT_MAPPING.LOG_FEED, message);
    lastTaskMessage = messageWithoutTime;
  }
}

let lastEventMessage = '';
/**
 * @param {import(".").NS } ns
 * @param {import(".").ScriptEvent } scriptEvent */
function logEvent(ns, scriptEvent) {
  const time = scriptEvent?.time || new Date();
  const messageWithoutTime = `${scriptEvent.action} ${scriptEvent.name}`;
  const message = `[${getFormattedTime(time)}] ${messageWithoutTime}`;
  if (messageWithoutTime !== lastEventMessage) {
    ns.writePort(PORT_MAPPING.LOG_FEED, message);
    lastEventMessage = messageWithoutTime;
  }
}

/** @param { import(".").NS } ns */
export function hasFormulas(ns) {
  return hasFileOnHome(ns, 'Formulas.exe');
}

export function hasFileOnHome(ns, upgradeName) {
  return ns.fileExists(upgradeName, 'home');
}

// TODO - THIS DOES NOT WORK
/** @param { import(".").NS } ns */
export function hasSingularity(ns) {
  try {
    ns.singularity.applyToCompany('foodnstuff', 'Employee');
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {import(".").NS } ns
 * @param {string} target
 * @returns {string[]} Order of servers to connect to, with the first item being home, and the last item being the target
 */
export function getPathFromHomeToTarget(ns, target) {
  const scanResults = ns.scan(target);
  const path = [];
  let parent = scanResults[0];
  do {
    path.push(parent);
    const parentScanResults = ns.scan(parent);
    parent = parentScanResults[0];
  } while (parent !== 'home');
  const reversed = path.reverse();
  return ['home', ...reversed, target];
}

/**
 * @param {import(".").NS } ns
 * @param {string} target
 */
export function connectTo(ns, target) {
  const path = getPathFromHomeToTarget(ns, target);
  path.forEach(serverName => ns.singularity.connect(serverName));
}
