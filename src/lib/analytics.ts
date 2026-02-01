import { Bet, BetStatus } from '@prisma/client';

// ==================== STREAK CALCULATION ====================
export interface StreakResult {
  count: number;
  type: 'win' | 'loss' | null;
}

export function calculateStreak(bets: Array<{ status: BetStatus; settledAt: Date | null; placedAt: Date }>): StreakResult {
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
  kellyFraction: number;       // Optimal fraction of bankroll to bet
  recommendedStake: number;    // Actual stake amount
  halfKellyStake: number;      // Conservative half-Kelly
  quarterKellyStake: number;   // Ultra-conservative quarter-Kelly
  edge: number;                // Your edge percentage
  isValueBet: boolean;         // Whether this is a +EV bet
}

/**
 * Calculate optimal bet size using Kelly Criterion
 * 
 * @param bankroll - Current bankroll amount
 * @param odds - Decimal odds (e.g., 1.50)
 * @param estimatedProbability - Your estimated win probability (0-1)
 * @returns Kelly calculation results
 */
export function calculateKelly(
  bankroll: number,
  odds: number,
  estimatedProbability: number
): KellyResult {
  // Kelly Formula: f* = (bp - q) / b
  // Where:
  // f* = fraction of bankroll to bet
  // b = decimal odds - 1 (net odds)
  // p = probability of winning
  // q = probability of losing (1 - p)

  const b = odds - 1; // Net odds (profit if win)
  const p = estimatedProbability;
  const q = 1 - p;

  // Calculate implied probability from odds
  const impliedProbability = 1 / odds;
  
  // Your edge = your probability - implied probability
  const edge = (p - impliedProbability) * 100;

  // Kelly fraction
  const kellyFraction = (b * p - q) / b;

  // If kelly is negative, it's not a value bet
  const isValueBet = kellyFraction > 0;

  // Cap Kelly at reasonable amounts (never bet more than 25%)
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
  profitableDays: number;
  losingDays: number;
}

export function calculateProfitLoss(
  bets: Array<{ status: BetStatus; stake: number; returns: number | null }>
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
    profitableDays: 0, // Calculate separately if needed
    losingDays: 0,
  };
}