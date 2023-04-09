import { connectTo } from 'utils.js';
import { AttackService } from 'services/attack.js';

// update this to also run the port opening scripts if they ports on target machines are not all open

/** @param {import(".").NS } ns */
export async function main(ns) {
  const attackService = new AttackService(ns);

  const isHelp = ns.args.includes('--help') || ns.args.includes('-h');

  if (isHelp) {
    printHelpMessage(ns);
    ns.exit();
  }

  const navToCSEC = ns.args.includes('--csec') || ns.args.includes('-c');
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
    target = 'CSEC';
  }

  if (navToNiteSec) {
    target = 'avmnite-02h';
  }

  if (navToBlackHand) {
    target = 'I.I.I.I';
  }

  if (navToBitrunners) {
    target = 'run4theh111z';
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

  const canBackdoor =
    ns.hasRootAccess(target) && ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target);
  if (tryToBackdoor && canBackdoor) {
    const server = ns.getServer(target);
    await attackService.openServer(server, 'home');
  } else if (tryToBackdoor && !canBackdoor) {
    ns.tprint('Unable to backdoor target server');
    connectTo(ns, 'home');
  }
}

/** @param {import(".").NS } ns */
function printHelpMessage(ns) {
  ns.tprint('Determines path to target server and connects if able.');
  ns.tprint('Usage: ./connect.js [options]');
  ns.tprint('Options:');
  ns.tprint('  -c, --csec\t\t\tConnect to CSEC server');
  ns.tprint('  -n, --nitesec\t\t\tConnect to NiteSec server');
  ns.tprint('  -b, --blackhand\t\t\tConnect to BlackHand server');
  ns.tprint('  -r, --bitrunners\t\t\tConnect to BitRunners server');
  ns.tprint('  -e, --cave\t\t\tConnect to The Cave server');
  ns.tprint(
    '  -d, --backdoor\t\t\tAttempt to backdoor target server after connecting, then connect to home server'
  );
  ns.tprint('  -h, --help\t\t\tShow this help message');
}
