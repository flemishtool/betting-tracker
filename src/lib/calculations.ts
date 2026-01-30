export interface ProjectionResult {
  day: number;
  balance: number;
  totalCashedOut: number;
  cumulativeProfit: number;
}

export function calculateSurvivalProbability(dailyWinRate: number, days: number): number {
  return Math.pow(dailyWinRate, days);
}

export function calculateMultiStreamSurvival(dailyWinRate: number, days: number, numStreams: number): number {
  const singleSurvival = calculateSurvivalProbability(dailyWinRate, days);
  return 1 - Math.pow(1 - singleSurvival, numStreams);
}

export function calculateNextStake(previousStake: number, odds: number, reinvestmentPercentage: number): number {
  const returns = previousStake * odds;
  return returns * reinvestmentPercentage;
}

export function calculateCashoutAmount(stake: number, odds: number, cashoutPercentage: number): number {
  const returns = stake * odds;
  return returns * cashoutPercentage;
}

export function calculateExpectedValue(winProbability: number, odds: number): number {
  return (winProbability * (odds - 1)) - (1 - winProbability);
}

export function calculateEdge(actualWinRate: number, odds: number): number {
  const impliedProbability = 1 / odds;
  return actualWinRate - impliedProbability;
}

export function calculateImpliedProbability(odds: number): number {
  return 1 / odds;
}

export function projectBalanceOverTime(initialStake: number, odds: number, reinvestmentPercentage: number, days: number): ProjectionResult[] {
  const results: ProjectionResult[] = [];
  let balance = initialStake;
  let totalCashedOut = 0;
  const cashoutPercentage = 1 - reinvestmentPercentage;

  for (let day = 0; day <= days; day++) {
    if (day === 0) {
      results.push({ day, balance, totalCashedOut: 0, cumulativeProfit: 0 });
      continue;
    }
    const returns = balance * odds;
    const cashout = returns * cashoutPercentage;
    totalCashedOut += cashout;
    balance = returns * reinvestmentPercentage;
    results.push({ day, balance, totalCashedOut, cumulativeProfit: balance + totalCashedOut - initialStake });
  }
  return results;
}

export function getCurrentPhaseRules(phaseRules: string | null, currentDay: number, defaultReinvest: number, defaultCashout: number): { reinvest: number; cashout: number } {
  if (!phaseRules) {
    return { reinvest: defaultReinvest, cashout: defaultCashout };
  }
  try {
    const phases = JSON.parse(phaseRules) as Array<{ day_start: number; day_end: number | null; reinvest: number; cashout: number }>;
    for (const phase of phases) {
      if (currentDay >= phase.day_start && (phase.day_end === null || currentDay <= phase.day_end)) {
        return { reinvest: phase.reinvest, cashout: phase.cashout };
      }
    }
  } catch { }
  return { reinvest: defaultReinvest, cashout: defaultCashout };
}

export function daysToTarget(currentBalance: number, targetBalance: number, odds: number, reinvestmentPercentage: number): number {
  if (currentBalance >= targetBalance) return 0;
  const factor = odds * reinvestmentPercentage;
  if (factor <= 1) return Infinity;
  return Math.ceil(Math.log(targetBalance / currentBalance) / Math.log(factor));
}