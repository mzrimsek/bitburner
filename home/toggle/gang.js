import { PORT_MAPPING } from 'utils.js';

/** @param {import(".").NS } ns */
export async function main(ns) {
  const currentData = ns.peek(PORT_MAPPING.DO_GANG);
  if (currentData === 0 || currentData === 1) {
    ns.clearPort(PORT_MAPPING.DO_GANG);

    const nextData = currentData === 0 ? 1 : 0;
    ns.writePort(PORT_MAPPING.DO_GANG, nextData);
  } else {
    ns.writePort(PORT_MAPPING.DO_GANG, 1); // default to true
  }
}
