import { EnvService } from 'services/env.js';

/** @param {import(".").NS } ns */
export async function main(ns) {
  const envService = new EnvService(ns);
  const hasSingularity = envService.hasSingularity();

  if (!hasSingularity) {
    ns.tprint('No singularity access detected. Exiting.');
    ns.exit();
  }

  const purchasedAndInstalledAugmentations = ns.singularity.getOwnedAugmentations(true);
  const installedAugmentations = ns.singularity.getOwnedAugmentations(false);
  const purchasedButNotInstalledAugmentations = purchasedAndInstalledAugmentations.filter(
    aug => !installedAugmentations.includes(aug)
  );

  if (purchasedButNotInstalledAugmentations.length === 0) {
    ns.tprint('No augmentations to install. Exiting.');
    ns.exit();
  }

  ns.singularity.installAugmentations('bootstrap.js');
}
