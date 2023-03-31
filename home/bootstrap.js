import { PORT_MAPPING, initPort, DEFAULT_PORT_VALUE } from 'utils.js';

/** @param {import(".").NS } ns */
export async function main(ns) {
  const isHelp = ns.args.includes('--help') || ns.args.includes('-h');

  if (isHelp) {
    printHelpMessage(ns);
    ns.exit();
  }

  const startStopped = ns.args.includes('--stopped') || ns.args.includes('-b');
  const startWithStonks = ns.args.includes('--stonks') || ns.args.includes('-s');
  const startWithoutGang = ns.args.includes('--no-gang') || ns.args.includes('-g');

  const openAll = ns.args.includes('--open') || ns.args.includes('-o');
  const openWindowsParam = openAll ? '' : '--no-open';

  ns.killall('home', true);

  // init ports
  if (startStopped) {
    initPort(ns, PORT_MAPPING.DO_BUY, 0);
  } else {
    initPort(ns, PORT_MAPPING.DO_BUY, 1);
  }

  if (startWithStonks) {
    initPort(ns, PORT_MAPPING.DO_STONKS, 1);
  } else {
    initPort(ns, PORT_MAPPING.DO_STONKS, 0);
  }

  if (startWithoutGang) {
    initPort(ns, PORT_MAPPING.DO_GANG, 0);
  } else {
    initPort(ns, PORT_MAPPING.DO_GANG, 1);
  }
  initPort(ns, PORT_MAPPING.DO_GANG_ASCEND, 0);

  const currentLiquidCash = ns.peek(PORT_MAPPING.STONKS_LIQUID_CASH_M);
  const initLiquidCash = currentLiquidCash !== DEFAULT_PORT_VALUE ? currentLiquidCash : 5;
  initPort(ns, PORT_MAPPING.STONKS_LIQUID_CASH_M, initLiquidCash);

  ns.run('/core/dashboard.js', 1);
  ns.run('/core/attackServer.js', 1, openWindowsParam);
  ns.run('/core/stonks.js', 1, openWindowsParam);

  ns.run('/monitoring/hud.js', 1);
  ns.run('/monitoring/log.js', 1);
  ns.run('/monitoring/showEnv.js', 1);
}

/** @param {import(".").NS } ns */
function printHelpMessage(ns) {
  ns.tprint(
    'Bootstrap script for the home server. This script will start all the other scripts and set up the ports for communication between them.'
  );
  ns.tprint('Usage: ./bootstrap.js [options]');
  ns.tprint('Options:');
  ns.tprint('  -s, --stonks\t\t\tStart with stocks enabled');
  ns.tprint('  -b, --stopped\t\t\tStart without bot purchasing and upgrading enabled');
  ns.tprint('  -g, --no-gang\t\t\tStart without gang monitoring enabled');
  ns.tprint('  -o, --open\t\t\tOpen all windows on start');
  ns.tprint('  -h, --help\t\t\tShow this help message');
  ns.tprint('');
  ns.tprint('Helpful Aliases:');
  ns.tprint('  tbuy\t\t\t\tToggle bots and hacknet nodes and upgrades');
  ns.tprint('  tstonk\t\t\t\tToggle stonks');
  ns.tprint('  tgang\t\t\t\tToggle gang monitoring');
  ns.tprint('  tgasc\t\t\t\tToggle automatic gang member ascension');
  ns.tprint('  slimit\t\t\t\tSet the limit for how much liquid cash to keep out of stonks');
}
/* bots printout
const numMaxedServers = servers.filter(server => server.maxRam === MAX_RAM).length;
    if (numMaxedServers === MAX_BOTS) {
        ns.print(`All ${MAX_BOTS} bots are maxed out`);
    } else if (numMaxedServers !== 0) {
        ns.print(`Maxed out bots: ${numMaxedServers}`);
    }

    const unMaxedservers = servers.filter(server => server.maxRam !== MAX_RAM);
    if (unMaxedservers.length !== 0) {
        ns.print('INFO\tCORES\tRAM\t\tUPCOST');
        const padSize = unMaxedservers.map(server => `${server.maxRam}`.length)[0];

        unMaxedservers.forEach(server => {
            const costToUpgrade = ns.getPurchasedServerUpgradeCost(server.hostname, server.maxRam * 2);
            ns.print(`${server.hostname}\t${server.cpuCores}\t${padString(server.maxRam, padSize)}GB\t\t$${ns.formatNumber(costToUpgrade)}`);
        });
    }
*/

/* hacknet printout
const hacknetIncome = hacknetService.getHacknetIncome();

    ns.print(`${numHackNetNodes} hacknet nodes producing $${hacknetIncome}/sec\n\n`);

    if (lastAction && lastNode && lastCost) {
        const message = `[${getFormattedTime(lastTime)}] ($${ns.formatNumber(lastCost)}) ${getActionMessage(lastAction)} ${lastNode}`;
        if (message !== lastLogMessage) {
            ns.writePort(PORT_MAPPING.LOG_FEED, message);
            lastLogMessage = message;
        }
    }
*/
