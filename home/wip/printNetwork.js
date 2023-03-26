/** @param {import("..").NS } ns */
export async function main(ns) {
  // const target = ns.args[0];

  // if (!target) {
  //     ns.tprint('Please provide target server to connect to');
  //     ns.exit();
  // }

  const children = ns.scan('home');
  const networkMap = getServerNames(ns, 'home', children);

  console.log(networkMap);
}

/** @param {import("..").NS } ns
 *  @param {string} host
 *  @param {string} parent
 *  @param {string[]} list
 */
function getServerNames(ns, host, children) {
  const mapped = children.reduce((all, child) => {
    const nextChildren = getChildren(ns, child, host);
    const next = getServerNames(ns, child, nextChildren);
    return {
      ...all,
      ...next
    };
  }, {});

  return {
    [host]: mapped
  };
}

/** @param {import("..").NS } ns
 *  @param {string} host
 *  @param {string} parent
 */
function getChildren(ns, host, parent) {
  return ns.scan(host).filter(child => {
    const isParent = parent && child === parent;
    return !isParent;
  });
}
