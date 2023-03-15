/** @param {NS} ns */
export async function main(ns) {
    if (!ns.args || ns.args.length === 0) {
        ns.tprint('Valid option required: --cybersec, --nitesec, --blackhand, --bitrunners, --cave, --stay, or --all');
        ns.exit();
    }

    const isBreachAll = ns.args.includes('--all');
    const isStay = ns.args.includes('--stay');

    if (isBreachAll && isStay) {
        ns.tprint('Cannot use --all and --stay in same execution');
        ns.exit();
    }

    const isCyberSec = ns.args.includes('--cybersec');
    const isNiteSec = ns.args.includes('--nitesec');
    const isBlackHand = ns.args.includes('--blackhand');
    const isBitRunners = ns.args.includes('--bitrunners');
    const isCave = ns.args.includes('--cave');

    const isServers = [isCyberSec, isNiteSec, isBlackHand, isBitRunners, isCave];
    const selectedServers = isServers.filter(x => x === true);
    if (isStay && selectedServers.length !== 1) {
        ns.tprint('Cannot target multiple with stay enabled');
        ns.exit();
    }

    // this shit is broken because I need to get the path dynamically by doing searching the tree of servers and getting the path to connect

    if (isCyberSec || isBreachAll) {
        const serverChain = ['hong-fang-tea', 'CSEC'];
        if (!isStay) { goHome(ns); }
        await connectAndBackdoor(ns, serverChain);
    }

    if (isNiteSec || isBreachAll) {
        const serverChain = ['sigma-cosmetics', 'nectar-net', 'silver-helix', 'avmnite-02h'];
        if (!isStay) { goHome(ns); }
        await connectAndBackdoor(ns, serverChain);
    }
    
    if (isBlackHand || isBreachAll) {
        const serverChain = ['hong-fang-tea', 'CSEC', 'omega-net', 'netlink', 'I.I.I.I'];
        if (!isStay) { goHome(ns); }
        await connectAndBackdoor(ns, serverChain);
    }
    
    if (isBitRunners || isBreachAll) {
        const serverChain = ['hong-fang-tea', 'CSEC', 'omega-net', 'netlink', 'catalyst', 'lexo-corp', 'galactic-cyber', 'omnia', 'solaris', 'infocom', 'runfortheh111z'];
        if (!isStay) { goHome(ns); }
        await connectAndBackdoor(ns, serverChain);
    }

    if (isCave || isBreachAll) {
        const serverChain = ['sigma-cosmetics', 'nectar-net', 'silver-helix', 'the-hub', 'summit-uni', 'rho-construction', 'snap-fitness', 'deltaone', 'icarus', 'nova-med', 'titan-labs', 'fulcrumtech', '.', 'powerhouse-fitness', 'The-Cave'];
        if (!isStay) { goHome(ns); }
        await connectAndBackdoor(ns, serverChain);
    }

    if (!isStay) { goHome(ns); }
    ns.run('console.js', 1, 'clear');
}

/** @param {string[]} serverChain */
function buildConnectString(serverChain) {
    return serverChain.reduce((connectString, server) => {
        return `${connectString} connect ${server};`;
    }, '');
}

/** @param {NS} ns */
async function connectAndBackdoor(ns, serverChain) {
    const connectString = buildConnectString(serverChain);
    ns.run('console.js', 1, connectString);
    await ns.sleep(500);
    ns.run('console.js', 1, 'backdoor');
    await ns.sleep(500);
}

/** @param {NS} ns */
function goHome(ns) {
    ns.run('console.js', 1, 'home');
}