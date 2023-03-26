import { getFormattedTime, PORT_MAPPING, getDocument, ACTIONS } from 'utils.js';
import { EnvService } from 'services/env.js';

/** @param {import("..").NS } ns */
export async function main(ns) {
  const openWindow = !ns.args.includes('--no-open');
  await handleStonks(ns, openWindow, 500, 800, 775, 5);
}

/** @param {import("..").NS } ns */
export async function handleStonks(
  ns,
  showWindow = false,
  width = 500,
  height = 570,
  xWidthOffset = 1345,
  yPos = 5
) {
  const logsToDisable = [
    'sleep',
    'getServerMoneyAvailable',
    'stock.buyShort',
    'stock.buyStock',
    'stock.sellShort',
    'stock.sellStock'
  ];
  logsToDisable.forEach(l => ns.disableLog(l));
  let is4SigmaAvailable = true;
  try {
    ns.stock.getForecast('FNS');
  } catch (error) {
    is4SigmaAvailable = false;
  }

  if (!is4SigmaAvailable) {
    ns.tprint('ERROR Purchase the 4Sigma API access, otherwise this script is not doing anything');
    ns.exit();
  }

  ns.atExit(() => {
    ns.closeTail(ns.pid);
  });

  readLogs(ns);

  const envService = new EnvService(ns);

  if (showWindow) {
    ns.tail();

    await ns.sleep(100);

    ns.resizeTail(width, height);
    ns.moveTail(getDocument().body.clientWidth - xWidthOffset, yPos);
  }

  while (true) {
    if (showWindow) ns.clearLog();
    printLogs(ns);
    await trader(ns, envService);
    for (let i = 0; i < 20; i++) await ns.sleep(99);
  }
}

////////////
// Trading

// Parameters:
const OPERATION_COST = 100000; // do not change this is fixed in the game

const MAX_STOCK_OWNED_PERCENT = 0.7; // maximum percentages of stock that can be owned at a time. (the more percent you own the more change you make on the market)
const MIN_FORECAST_PERCENT = 0.1; // min forecast percent from 0.5
const MIN_EXIT_FORECAST_PERCENT = 0.05; // in case the forecast turn under this value than exit.

// Implementation:
/** @param {import("..").NS } ns */
async function trader(ns, envService) {
  const stock = ns.stock;

  ns.print('\nINFO\tEXISTING POSITIONS');

  const debugHeader = () => {
    ns.print('SYM \tFCAST  VOLA RANK  INVESTMNT INCOME');
  };
  const debugPrint = (sym, isLong) => {
    const income = getPossibleIncome(stock, sym);
    const investment = getInvestmentCost(stock, sym);
    let endStr = '';
    let symStr = ' ' + sym;
    if (isLong != undefined) {
      symStr = (isLong ? '📈' : '📉') + sym;
      endStr = ` 💲${ns.nFormat(investment, '000.00a')} 💲${ns.nFormat(income, '000.00a')} ${
        income > 0 ? '👍' : '👎'
      }`;
    }
    ns.print(
      `${symStr}\t${stock.getForecast(sym).toFixed(2)} - ${(stock.getVolatility(sym) * 100).toFixed(
        2
      )} ${ns.nFormat(getSymbolPoint(stock, sym), '00.00')}` + endStr
    );
  };
  // sell if not good anymore
  const ownedSmybols = getOwnedSymbols(stock);
  debugHeader();
  for (let sym of ownedSmybols) {
    if (!shouldExit(stock, sym.sym)) {
      debugPrint(sym.sym, sym.long > 0);
    } else if (sym.long > 0) {
      await logSell(ns, sym);
      stock.sellStock(sym.sym, sym.long);
    } else if (sym.short > 0) {
      try {
        stock.sellShort(sym.sym, sym.short);
        await logSell(ns, sym);
      } catch {
        console.log('cannot short');
      }
    }
  }

  ns.print('\nINFO \tPOSSIBLE POSITIONS');
  // buy if has some great stock option
  debugHeader();
  const symbols = sortAndFilterSymbols(stock);
  for (let sym of symbols) {
    const money = availableMoney(ns, envService) - OPERATION_COST;
    const [shares, avgPx, sharesShort, avgPxShort] = stock.getPosition(sym);
    const isLong = stock.getForecast(sym) > 0.5;
    const amountToBuy = stock.getMaxShares(sym) * MAX_STOCK_OWNED_PERCENT - shares - sharesShort;

    if (envService.getDoStonks()) {
      if (isLong) {
        const amountToAfford = Math.min(amountToBuy, Math.floor(money / stock.getAskPrice(sym)));
        if (amountToAfford > 0 && ns.getPlayer().bitNodeN) {
          await logBuy(ns, { sym, long: amountToAfford });
          stock.buyStock(sym, amountToAfford);
        }
      } else {
        const amountToAfford = Math.min(amountToBuy, Math.floor(money / stock.getBidPrice(sym)));
        if (amountToAfford > 0) {
          try {
            stock.buyShort(sym, amountToAfford);
            await logBuy(ns, { sym, short: amountToAfford });
          } catch {
            console.log('cannot short');
          }
        }
      }
    }

    if (shares > 0 || sharesShort > 0) continue;
    debugPrint(sym);
  }
}

/** @param {import("..").NS } ns */
function availableMoney(ns, envService) {
  const keepMoney = envService.getMillionsToKeepLiquid() * 1000000;
  const money = ns.getServerMoneyAvailable('home') - keepMoney;
  return money;
}

/** @param {TIX} stock */
function getPossibleIncome(stock, sym) {
  const [shares, avgPx, sharesShort, avgPxShort] = stock.getPosition(sym);
  let income = -OPERATION_COST;
  if (shares > 0) income += (stock.getBidPrice(sym) - avgPx) * shares;
  else income += (avgPxShort - stock.getAskPrice(sym)) * sharesShort;
  return income;
}

/** @param {TIX} stock */
function getInvestmentCost(stock, sym) {
  const [shares, avgPx, sharesShort, avgPxShort] = stock.getPosition(sym);
  let income = OPERATION_COST;
  if (shares > 0) income += avgPx * shares;
  else income += avgPxShort * sharesShort;
  return income;
}

/** @param {TIX} stock */
function getExitGain(stock, sym) {
  const [shares, avgPx, sharesShort, avgPxShort] = stock.getPosition(sym);
  if (shares > 0) return stock.getBidPrice(sym) * shares;
  else return stock.getAskPrice(sym) * sharesShort;
}

/** @param {TIX} stock */
function getOwnedSymbols(stock) {
  const symbols = stock
    .getSymbols()
    .map(sym => {
      const [shares, avgPx, sharesShort, avgPxShort] = stock.getPosition(sym);
      return { sym, short: sharesShort, long: shares };
    })
    .filter(sym => sym.short > 0 || sym.long > 0);
  return symbols.sort((a, b) => getPossibleIncome(stock, a.sym) - getPossibleIncome(stock, b.sym));
}

/** @param {TIX} stock */
function sortAndFilterSymbols(stock) {
  const filteredSymbols = stock
    .getSymbols()
    .filter(a => getSymbolPoint(stock, a) > 0) // check if it's even good for us to trade
    .filter(sym => {
      // check if we didn't over buy this symbol
      const [shares, avgPx, sharesShort, avgPxShort] = stock.getPosition(sym);
      return stock.getMaxShares(sym) * MAX_STOCK_OWNED_PERCENT > Math.max(shares, sharesShort);
    });
  return filteredSymbols.sort((a, b) => getSymbolPoint(stock, b) - getSymbolPoint(stock, a));
}

/** @param {TIX} stock */
function getSymbolPoint(stock, sym) {
  const forecast = Math.abs(stock.getForecast(sym) - 0.5);
  const adjustedForecast = forecast * (1 / MIN_FORECAST_PERCENT); // * Math.E
  if (forecast < MIN_FORECAST_PERCENT) return 0;
  else return adjustedForecast * stock.getVolatility(sym) * 100;
}

/** @param {TIX} stock */
function shouldExit(stock, sym) {
  const [shares, avgPx, sharesShort, avgPxShort] = stock.getPosition(sym);
  if (sharesShort == 0 && shares == 0) return false;
  const forecast = stock.getForecast(sym);
  if (sharesShort > 0) {
    return forecast + MIN_EXIT_FORECAST_PERCENT >= 0.5;
  } else {
    return forecast - MIN_EXIT_FORECAST_PERCENT <= 0.5;
  }
}

////////////
// LOGGING

// Paramters:
const LOG_FILE_PREFIX = '/tmp/stock/logs';
const INCOME_FILE_PREFIX = '/tmp/stock/income';
const NUM_LOG_ROWS = 8; // the maximum number of buy/sell logs to display

let logs = [];
let earnedMoney = 0;

const dateSuffix = ns =>
  `${ns.nFormat(new Date().getMonth(), '00')}-${ns.nFormat(new Date().getDate(), '00')}`;
/** @param {import("..").NS } ns */
function readLogs(ns) {
  const logFile = `${LOG_FILE_PREFIX}_${dateSuffix(ns)}.txt`;
  const incomeFile = `${INCOME_FILE_PREFIX}_${dateSuffix(ns)}.txt`;
  if (ns.fileExists(logFile)) logs = JSON.parse(ns.read(logFile));
  if (ns.fileExists(incomeFile)) earnedMoney = JSON.parse(ns.read(incomeFile)).income;
}

/** @param {import("..").NS } ns */
async function writeLogs(ns) {
  const logFile = `${LOG_FILE_PREFIX}_${dateSuffix(ns)}.txt`;
  const incomeFile = `${INCOME_FILE_PREFIX}_${dateSuffix(ns)}.txt`;
  await ns.write(logFile, JSON.stringify(logs), 'w');
  await ns.write(incomeFile, JSON.stringify({ income: earnedMoney }), 'w');
}

/** @param {import("..").NS } ns */
async function logSell(ns, symObj) {
  const profit = getPossibleIncome(ns.stock, symObj.sym);
  earnedMoney += profit;
  await logBuySell(ns, { ...symObj, profit }, false);
}

/** @param {import("..").NS } ns */
async function logBuy(ns, symObj) {
  await logBuySell(ns, symObj, true);
}

/** @param {import("..").NS } ns */
async function logBuySell(ns, symObj, isBuy) {
  const { sym, long, short, profit } = symObj;
  const dateObj = new Date();
  const date = `${ns.nFormat(dateObj.getHours(), '00')}:${ns.nFormat(dateObj.getMinutes(), '00')}`;

  const data = { sym, long, short, profit, isBuy, date };
  writeToPort(ns, data, dateObj);

  logs.push(data);
  if (logs.length > NUM_LOG_ROWS) {
    logs.shift();
  }
  await writeLogs(ns);
}

function writeToPort(ns, data, date) {
  const { sym, long, short, profit, isBuy } = data;

  const amount =
    short > 0
      ? `(${ACTIONS.SHORT} $${ns.formatNumber(short)})`
      : `(${ACTIONS.LONG} $${ns.formatNumber(long)})`;
  const operation = isBuy ? ACTIONS.BUY : ACTIONS.SELL;
  const symStr = sym.length == 3 ? sym + ' ' : sym;
  const profitStr = profit ? `💲${ns.formatNumber(profit)}` : '';

  const message = `[${getFormattedTime(date)}] ${amount} ${operation} ${symStr} ${profitStr}`;
  ns.writePort(PORT_MAPPING.LOG_FEED, message);
}

/** @param {import("..").NS } ns */
function printLogs(ns) {
  const onMarketValueChange = getOwnedSymbols(ns.stock)
    .map(s => getPossibleIncome(ns.stock, s.sym))
    .reduce((a, b) => a + b, 0);
  const onMarketValue = getOwnedSymbols(ns.stock)
    .map(s => getExitGain(ns.stock, s.sym))
    .reduce((a, b) => a + b, 0);

  ns.print(
    `On Market:     💲${ns.nFormat(onMarketValue, '0.0a')}(+💲${ns.nFormat(
      onMarketValueChange,
      '0.0a'
    )})`
  );
  ns.print(`Earned(today): 💲${ns.nFormat(earnedMoney, '0.0a')}`);
  ns.print('INFO\tBUY/SELL LOG');
  // const date = new Date()
  for (let log of logs) {
    const { sym, long, short, isBuy, profit, date } = log;
    const operation = isBuy ? 'BUY ' : 'SELL';
    const amount =
      short > 0 ? `SHORT ${ns.nFormat(short, '000.0a')}` : `LONG  ${ns.nFormat(long, '000.0a')}`;
    const profitStr = profit ? `💲${ns.nFormat(profit, '0.0a')}` : '';
    const symStr = sym.length == 3 ? sym + ' ' : sym;
    ns.print(`[${date}] ${operation} ${symStr} - ${amount} ${profitStr}`);
  }
}
