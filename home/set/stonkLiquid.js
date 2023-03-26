import { PORT_MAPPING } from 'utils.js';

/** @param {import("..").NS } ns */
export async function main(ns) {
  if (ns.args.length !== 1) {
    ns.tprint('Usage: stonkLiquid.js VALUE');
    ns.exit();
  }

  const newLimit = parseInt(ns.args[0], 10);
  if (newLimit < 0 || isNaN(newLimit)) {
    ns.tprint('Limit must be 0 or greater');
    ns.exit();
  }

  ns.clearPort(PORT_MAPPING.STONKS_LIQUID_CASH_M);
  ns.writePort(PORT_MAPPING.STONKS_LIQUID_CASH_M, newLimit);
}
