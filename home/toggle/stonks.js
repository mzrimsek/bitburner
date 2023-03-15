import { PORT_MAPPING } from 'utils.js';

/** @param {NS} ns */
export async function main(ns) {
    const currentData = ns.peek(PORT_MAPPING.DO_STONKS);
    if (currentData === 0 || currentData === 1) {
        ns.clearPort(PORT_MAPPING.DO_STONKS);

        const nextData = currentData === 0 ? 1 : 0;
        ns.writePort(PORT_MAPPING.DO_STONKS, nextData);
    } else {
        ns.writePort(PORT_MAPPING.DO_STONKS, 1); // default to true
    }
}