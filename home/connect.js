import { connectTo } from 'utils.js';
import { AttackService } from 'services/attack.js';

// update this to also run the port opening scripts if they ports on target machines are not all open

/** @type {Record<string, string>} */
const CORE_TARGETS = {
  CYBERSEC: 'CSEC',
  NITESEC: 'avmnite-02h',
  BLACKHAND: 'I.I.I.I',
  BITRUNNERS: 'run4theh111z'
};

/** @param {import(".").NS } ns */
export async function main(ns) {
  const attackService = new AttackService(ns);

  const isHelp = ns.args.includes('--help') || ns.args.includes('-h');

  if (isHelp) {
    printHelpMessage(ns);
    ns.exit();
  }

  const isBlast = ns.args.includes('--blast') || ns.args.includes('-a');
  if (isBlast) {
    const servers = Object.keys(CORE_TARGETS).map(key => CORE_TARGETS[key]);
    for (const server of servers) {
      await attemptToOpenServer(ns, server, attackService);
    }
    ns.exit();
  }

  const navToCSEC = ns.args.includes('--cybersec') || ns.args.includes('-c');
  const navToNiteSec = ns.args.includes('--nitesec') || ns.args.includes('-n');
  const navToBlackHand = ns.args.includes('--blackhand') || ns.args.includes('-b');
  const navToBitrunners = ns.args.includes('--bitrunners') || ns.args.includes('-r');
  const navToCave = ns.args.includes('--cave') || ns.args.includes('-e');
  const navToWorldDaemon = ns.args.includes('--worlddaemon') || ns.args.includes('-w');

  const tryToBackdoor = ns.args.includes('--backdoor') || ns.args.includes('-d');

  const flags = [
    navToCSEC,
    navToNiteSec,
    navToBlackHand,
    navToBitrunners,
    navToCave,
    navToWorldDaemon
  ];

  let target = ns.args.filter(arg => !arg.startsWith('-') && !arg.startsWith('--'))[0];

  const hasMoreThanOneFlag = flags.filter(Boolean).length > 1;
  const hasAtLeastOneFlag = flags.filter(Boolean).length > 0;
  if (hasMoreThanOneFlag || (target && hasAtLeastOneFlag)) {
    ns.tprint('Too many targets specified');
    ns.exit();
  }

  if (navToCSEC) {
    target = CORE_TARGETS.CYBERSEC;
  }

  if (navToNiteSec) {
    target = CORE_TARGETS.NITESEC;
  }

  if (navToBlackHand) {
    target = CORE_TARGETS.BLACKHAND;
  }

  if (navToBitrunners) {
    target = CORE_TARGETS.BITRUNNERS;
  }

  if (navToCave) {
    target = 'The-Cave';
  }

  if (navToWorldDaemon) {
    target = 'w0r1d_d43m0n';
  }

  if (!target) {
    ns.tprint('No target specified');
    ns.exit();
  }

  connectTo(ns, target);

  if (tryToBackdoor) {
    await attemptToOpenServer(ns, target, attackService);
  }
}

/**
 *
 * @param {import(".").NS} ns
 * @param {string} target
 * @param {AttackService} attackService
 */
async function attemptToOpenServer(ns, target, attackService) {
  const canBackdoor =
    ns.hasRootAccess(target) && ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target);
  if (canBackdoor) {
    const server = ns.getServer(target);
    await attackService.openServer(server, 'home');
  } else if (!canBackdoor) {
    ns.tprint('Unable to backdoor target server');
    connectTo(ns, 'home');
  }
}

/** @param {import(".").NS } ns */
function printHelpMessage(ns) {
  ns.tprint('Determines path to target server and connects if able.');
  ns.tprint('Usage: ./connect.js [options]');
  ns.tprint('Options:');
  ns.tprint('  -c, --cybersec\t\t\tConnect to CyberSec server');
  ns.tprint('  -n, --nitesec\t\t\tConnect to NiteSec server');
  ns.tprint('  -b, --blackhand\t\t\tConnect to BlackHand server');
  ns.tprint('  -r, --bitrunners\t\t\tConnect to BitRunners server');
  ns.tprint('  -e, --cave\t\t\tConnect to The Cave server');
  ns.tprint(
    '  -d, --backdoor\t\t\tAttempt to backdoor target server after connecting, then connect to home server'
  );
  ns.tprint(
    '  -a, --blast\t\t\tAtttempt to connect to and fully open CyberSec, NiteSec, Black Hand, and BitRunners servers'
  );
  ns.tprint('  -h, --help\t\t\tShow this help message');
}
