// ==================== STREAK CALCULATION ====================
export interface StreakResult {
  count: number;
  type: 'win' | 'loss' | null;
}

export function calculateStreak(
  bets: Array<{ status: string; settledAt: Date | null; placedAt: Date }>
): StreakResult {
  const settledBets = bets
    .filter(bet => bet.status === 'won' || bet.status === 'lost')
    .sort((a, b) => {
      const dateA = a.settledAt || a.placedAt;
      const dateB = b.settledAt || b.placedAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

  let count = 0;
  let type: 'win' | 'loss' | null = null;

  for (const bet of settledBets) {
    const currentType = bet.status === 'won' ? 'win' : 'loss';

    if (type === null) {
      type = currentType;
      count = 1;
    } else if (type === currentType) {
      count++;
    } else {
      break;
    }
  }

  return { count, type };
}

// ==================== KELLY CRITERION CALCULATOR ====================
export interface KellyResult {
  kellyFraction: number;
  recommendedStake: number;
  halfKellyStake: number;
  quarterKellyStake: number;
  edge: number;
  isValueBet: boolean;
}

/**
 * Calculate optimal bet size using Kelly Criterion
 */
export function calculateKelly(
  bankroll: number,
  odds: number,
  estimatedProbability: number
): KellyResult {
  const b = odds - 1;
  const p = estimatedProbability;
  const q = 1 - p;

  const impliedProbability = 1 / odds;
  const edge = (p - impliedProbability) * 100;
  const kellyFraction = (b * p - q) / b;
  const isValueBet = kellyFraction > 0;
  const cappedKelly = Math.max(0, Math.min(kellyFraction, 0.25));

  return {
    kellyFraction: cappedKelly,
    recommendedStake: Math.round(bankroll * cappedKelly * 100) / 100,
    halfKellyStake: Math.round(bankroll * cappedKelly * 0.5 * 100) / 100,
    quarterKellyStake: Math.round(bankroll * cappedKelly * 0.25 * 100) / 100,
    edge: Math.round(edge * 100) / 100,
    isValueBet,
  };
}

// ==================== ROI & STATS HELPERS ====================
export function calculateROI(totalStaked: number, totalReturns: number): number {
  if (totalStaked === 0) return 0;
  return ((totalReturns - totalStaked) / totalStaked) * 100;
}

export function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 0;
  return (wins / total) * 100;
}

export function calculateAverageOdds(bets: Array<{ totalOdds: number }>): number {
  if (bets.length === 0) return 0;
  const sum = bets.reduce((acc, bet) => acc + bet.totalOdds, 0);
  return sum / bets.length;
}

// ==================== PROFIT/LOSS CALCULATION ====================
export interface ProfitLossResult {
  totalProfit: number;
  totalLoss: number;
  netProfitLoss: number;
}

export function calculateProfitLoss(
  bets: Array<{ status: string; stake: number; returns: number | null }>
): ProfitLossResult {
  let totalProfit = 0;
  let totalLoss = 0;

  bets.forEach(bet => {
    if (bet.status === 'won' && bet.returns) {
      totalProfit += bet.returns - bet.stake;
    } else if (bet.status === 'lost') {
      totalLoss += bet.stake;
    }
  });

  return {
    totalProfit,
    totalLoss,
    netProfitLoss: totalProfit - totalLoss,
  };
}