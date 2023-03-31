import { PORT_MAPPING } from 'utils.js';

/** @param {import(".").NS } ns */
export async function main(ns) {
  const currentData = ns.peek(PORT_MAPPING.DO_CORP_AUTOHIRE);
  if (currentData === 0 || currentData === 1) {
    ns.clearPort(PORT_MAPPING.DO_CORP_AUTOHIRE);

    const nextData = currentData === 0 ? 1 : 0;
    ns.writePort(PORT_MAPPING.DO_CORP_AUTOHIRE, nextData);
  } else {
    ns.writePort(PORT_MAPPING.DO_CORP_AUTOHIRE, 0); // default to off
  }
}
