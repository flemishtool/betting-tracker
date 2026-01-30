export interface Stream {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'failed';
  initialStake: number;
  currency: string;
  targetDailyOdds: number;
  reinvestmentPercentage: number;
  cashoutPercentage: number;
  targetBalance: number | null;
  targetDays: number | null;
  phaseRules: string | null;
  currentBalance: number;
  totalCashedOut: number;
  currentDay: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  actualWinRate: number;
  createdAt: string;
  startedAt: string;
  endedAt: string | null;
  bets?: Bet[];
}

export interface Bet {
  id: string;
  streamId: string;
  dayNumber: number;
  date: string;
  stake: number;
  totalOdds: number;
  status: 'pending' | 'won' | 'lost' | 'void';
  returns: number | null;
  profit: number | null;
  amountReinvested: number | null;
  amountCashedOut: number | null;
  balanceAfter: number | null;
  placedAt: string;
  settledAt: string | null;
  selections?: Selection[];
  stream?: Stream;
}

export interface Selection {
  id: string;
  betId: string;
  leagueId: string | null;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  market: string;
  selection: string;
  odds: number;
  estimatedProbability: number;
  status: 'pending' | 'won' | 'lost' | 'void';
  result: string | null;
  apiFixtureId: string | null;
  settledAt: string | null;
  league?: League | null;
}

export interface League {
  id: string;
  name: string;
  country: string;
  apiFootballId: number | null;
  avgGoalsPerMatch: number | null;
  over05GoalsRate: number | null;
  over15GoalsRate: number | null;
  over25GoalsRate: number | null;
  bttsYesRate: number | null;
  avgCardsPerMatch: number | null;
  avgCornersPerMatch: number | null;
  totalSelections: number;
  wonSelections: number;
  actualHitRate: number;
  isActive: boolean;
}

export interface MarketType {
  id: string;
  name: string;
  category: string;
  baselineProbability: number;
  typicalOddsLow: number | null;
  typicalOddsHigh: number | null;
  totalSelections: number;
  wonSelections: number;
  actualHitRate: number;
  notes: string | null;
}

export interface Bankroll {
  id: string;
  totalCapital: number;
  availableCapital: number;
  deployedCapital: number;
  reservedCapital: number;
  currency: string;
  totalDeposited: number;
  totalWithdrawn: number;
  totalCashedOutFromStreams: number;
  lifetimeProfitLoss: number;
  maxConcurrentStreams: number;
  maxSingleStreamPercentage: number;
  maxTotalExposurePercentage: number;
  stopLossThreshold: number;
  profitLockThreshold: number;
  profitLockPercentage: number;
  autoWithdrawEnabled: boolean;
  autoWithdrawTrigger: number;
  autoWithdrawAmount: number;
  status: 'active' | 'paused' | 'stopped';
  pausedReason: string | null;
}

export interface BankrollTransaction {
  id: string;
  bankrollId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  streamId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface APIFixture {
  id: string;
  apiFootballId: number;
  leagueId: string | null;
  apiLeagueId: number;
  season: number;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  kickoff: string;
  venue: string | null;
  status: string;
  league?: League | null;
}