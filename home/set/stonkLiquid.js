import { PORT_MAPPING } from 'utils.js';

/** @param {import("..").NS } ns */
export async function main(ns) {
  const newLimit = ns.args.find(arg => arg.startsWith('--limit='));
  if (newLimit === undefined) {
    ns.tprint('No limit provided');
    ns.exit();
  }

  const newLimitValue = parseInt(newLimit.split('=')[1], 10);
  if (newLimitValue < 0 || isNaN(newLimitValue)) {
    ns.tprint('Limit must be 0 or greater');
    ns.exit();
  }

  ns.clearPort(PORT_MAPPING.STONKS_LIQUID_CASH_M);
  ns.writePort(PORT_MAPPING.STONKS_LIQUID_CASH_M, newLimitValue);
}