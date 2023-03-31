import { PORT_MAPPING } from 'utils.js';

/** @param {import(".").NS } ns */
export async function main(ns) {
  const currentData = ns.peek(PORT_MAPPING.DO_GANG_ASCEND);
  if (currentData === 0 || currentData === 1) {
    ns.clearPort(PORT_MAPPING.DO_GANG_ASCEND);

    const nextData = currentData === 0 ? 1 : 0;
    ns.writePort(PORT_MAPPING.DO_GANG_ASCEND, nextData);
  } else {
    ns.writePort(PORT_MAPPING.DO_GANG_ASCEND, 0); // default to off
  }
}
