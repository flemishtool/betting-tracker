import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database v2...');

  // Create default bankroll
  await prisma.bankroll.upsert({
    where: { id: 'default-bankroll' },
    update: {},
    create: {
      id: 'default-bankroll',
      totalCapital: 0,
      availableCapital: 0,
      deployedCapital: 0,
      reservedCapital: 0,
      currency: 'GBP',
    },
  });
  console.log('✅ Created bankroll');

  // Create API config
  await prisma.aPIConfig.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      baseUrl: 'https://v3.football.api-sports.io',
      requestsPerMinute: 450,
      requestsPerDay: 7500,
    },
  });
  console.log('✅ Created API config');

  // Delete existing leagues and markets
  await prisma.league.deleteMany({});
  await prisma.marketType.deleteMany({});

  // ============================================================
  // LEAGUES - Organized by Region/Country
  // ============================================================
  const leagues = [
    // ==================== ENGLAND ====================
    { name: 'Premier League', country: 'England', apiFootballId: 39, over15GoalsRate: 0.87, over25GoalsRate: 0.71, avgGoalsPerMatch: 2.85 },
    { name: 'Championship', country: 'England', apiFootballId: 40, over15GoalsRate: 0.86, over25GoalsRate: 0.69, avgGoalsPerMatch: 2.75 },
    { name: 'League One', country: 'England', apiFootballId: 41, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.70 },
    { name: 'League Two', country: 'England', apiFootballId: 42, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.62 },
    { name: 'National League', country: 'England', apiFootballId: 43, over15GoalsRate: 0.83, over25GoalsRate: 0.65, avgGoalsPerMatch: 2.55 },
    { name: 'FA Cup', country: 'England', apiFootballId: 45, over15GoalsRate: 0.84, over25GoalsRate: 0.67, avgGoalsPerMatch: 2.65 },
    { name: 'EFL Cup', country: 'England', apiFootballId: 48, over15GoalsRate: 0.85, over25GoalsRate: 0.69, avgGoalsPerMatch: 2.75 },
    { name: 'EFL Trophy', country: 'England', apiFootballId: 46, over15GoalsRate: 0.83, over25GoalsRate: 0.65, avgGoalsPerMatch: 2.55 },

    // ==================== SPAIN ====================
    { name: 'La Liga', country: 'Spain', apiFootballId: 140, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.65 },
    { name: 'La Liga 2', country: 'Spain', apiFootballId: 141, over15GoalsRate: 0.82, over25GoalsRate: 0.62, avgGoalsPerMatch: 2.45 },
    { name: 'Copa del Rey', country: 'Spain', apiFootballId: 143, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.60 },

    // ==================== GERMANY ====================
    { name: 'Bundesliga', country: 'Germany', apiFootballId: 78, over15GoalsRate: 0.91, over25GoalsRate: 0.78, avgGoalsPerMatch: 3.17 },
    { name: '2. Bundesliga', country: 'Germany', apiFootballId: 79, over15GoalsRate: 0.88, over25GoalsRate: 0.72, avgGoalsPerMatch: 2.95 },
    { name: '3. Liga', country: 'Germany', apiFootballId: 80, over15GoalsRate: 0.86, over25GoalsRate: 0.69, avgGoalsPerMatch: 2.78 },
    { name: 'DFB Pokal', country: 'Germany', apiFootballId: 81, over15GoalsRate: 0.87, over25GoalsRate: 0.72, avgGoalsPerMatch: 2.90 },

    // ==================== ITALY ====================
    { name: 'Serie A', country: 'Italy', apiFootballId: 135, over15GoalsRate: 0.84, over25GoalsRate: 0.67, avgGoalsPerMatch: 2.72 },
    { name: 'Serie B', country: 'Italy', apiFootballId: 136, over15GoalsRate: 0.82, over25GoalsRate: 0.63, avgGoalsPerMatch: 2.50 },
    { name: 'Coppa Italia', country: 'Italy', apiFootballId: 137, over15GoalsRate: 0.83, over25GoalsRate: 0.65, avgGoalsPerMatch: 2.58 },

    // ==================== FRANCE ====================
    { name: 'Ligue 1', country: 'France', apiFootballId: 61, over15GoalsRate: 0.83, over25GoalsRate: 0.65, avgGoalsPerMatch: 2.55 },
    { name: 'Ligue 2', country: 'France', apiFootballId: 62, over15GoalsRate: 0.81, over25GoalsRate: 0.61, avgGoalsPerMatch: 2.42 },
    { name: 'Coupe de France', country: 'France', apiFootballId: 66, over15GoalsRate: 0.82, over25GoalsRate: 0.64, avgGoalsPerMatch: 2.52 },

    // ==================== NETHERLANDS ====================
    { name: 'Eredivisie', country: 'Netherlands', apiFootballId: 88, over15GoalsRate: 0.92, over25GoalsRate: 0.81, avgGoalsPerMatch: 3.35 },
    { name: 'Eerste Divisie', country: 'Netherlands', apiFootballId: 89, over15GoalsRate: 0.88, over25GoalsRate: 0.73, avgGoalsPerMatch: 2.95 },
    { name: 'KNVB Beker', country: 'Netherlands', apiFootballId: 90, over15GoalsRate: 0.89, over25GoalsRate: 0.75, avgGoalsPerMatch: 3.05 },

    // ==================== PORTUGAL ====================
    { name: 'Primeira Liga', country: 'Portugal', apiFootballId: 94, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.68 },
    { name: 'Liga Portugal 2', country: 'Portugal', apiFootballId: 95, over15GoalsRate: 0.82, over25GoalsRate: 0.63, avgGoalsPerMatch: 2.48 },
    { name: 'Taça de Portugal', country: 'Portugal', apiFootballId: 96, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.62 },

    // ==================== BELGIUM ====================
    { name: 'Pro League', country: 'Belgium', apiFootballId: 144, over15GoalsRate: 0.88, over25GoalsRate: 0.72, avgGoalsPerMatch: 2.95 },
    { name: 'Challenger Pro League', country: 'Belgium', apiFootballId: 145, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.72 },
    { name: 'Greek Cup', country: 'Greece', apiFootballId: 198, over15GoalsRate: 0.82, over25GoalsRate: 0.63, avgGoalsPerMatch: 2.48 },

    // ==================== SCOTLAND ====================
    { name: 'Premiership', country: 'Scotland', apiFootballId: 179, over15GoalsRate: 0.88, over25GoalsRate: 0.72, avgGoalsPerMatch: 2.90 },
    { name: 'Championship', country: 'Scotland', apiFootballId: 180, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.72 },
    { name: 'Scottish Cup', country: 'Scotland', apiFootballId: 182, over15GoalsRate: 0.86, over25GoalsRate: 0.69, avgGoalsPerMatch: 2.78 },
    { name: 'Scottish League Cup', country: 'Scotland', apiFootballId: 181, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.72 },

    // ==================== TURKEY ====================
    { name: 'Süper Lig', country: 'Turkey', apiFootballId: 203, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.78 },
    { name: '1. Lig', country: 'Turkey', apiFootballId: 204, over15GoalsRate: 0.83, over25GoalsRate: 0.65, avgGoalsPerMatch: 2.55 },
    { name: 'Turkish Cup', country: 'Turkey', apiFootballId: 206, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.60 },

    // ==================== AUSTRIA ====================
    { name: 'Bundesliga', country: 'Austria', apiFootballId: 218, over15GoalsRate: 0.89, over25GoalsRate: 0.74, avgGoalsPerMatch: 3.05 },
    { name: '2. Liga', country: 'Austria', apiFootballId: 219, over15GoalsRate: 0.86, over25GoalsRate: 0.69, avgGoalsPerMatch: 2.78 },

    // ==================== SWITZERLAND ====================
    { name: 'Super League', country: 'Switzerland', apiFootballId: 207, over15GoalsRate: 0.87, over25GoalsRate: 0.71, avgGoalsPerMatch: 2.88 },
    { name: 'Challenge League', country: 'Switzerland', apiFootballId: 208, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.62 },

    // ==================== GREECE ====================
    { name: 'Super League', country: 'Greece', apiFootballId: 197, over15GoalsRate: 0.83, over25GoalsRate: 0.64, avgGoalsPerMatch: 2.48 },
    { name: 'Greek Cup', country: 'Greece', apiFootballId: 198, over15GoalsRate: 0.82, over25GoalsRate: 0.63, avgGoalsPerMatch: 2.48 },

    // ==================== DENMARK ====================
    { name: 'Superliga', country: 'Denmark', apiFootballId: 119, over15GoalsRate: 0.88, over25GoalsRate: 0.73, avgGoalsPerMatch: 2.98 },
    { name: '1st Division', country: 'Denmark', apiFootballId: 120, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.72 },
    { name: 'Danish Cup', country: 'Denmark', apiFootballId: 121, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.82 },

    // ==================== NORWAY ====================
    { name: 'Eliteserien', country: 'Norway', apiFootballId: 103, over15GoalsRate: 0.89, over25GoalsRate: 0.75, avgGoalsPerMatch: 3.08 },
    { name: 'OBOS-ligaen', country: 'Norway', apiFootballId: 104, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.82 },

    // ==================== SWEDEN ====================
    { name: 'Allsvenskan', country: 'Sweden', apiFootballId: 113, over15GoalsRate: 0.87, over25GoalsRate: 0.72, avgGoalsPerMatch: 2.92 },
    { name: 'Superettan', country: 'Sweden', apiFootballId: 114, over15GoalsRate: 0.84, over25GoalsRate: 0.67, avgGoalsPerMatch: 2.68 },
    { name: 'Svenska Cupen', country: 'Sweden', apiFootballId: 115, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.72 },

    // ==================== FINLAND ====================
    { name: 'Veikkausliiga', country: 'Finland', apiFootballId: 244, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.80 },

    // ==================== CZECH REPUBLIC ====================
    { name: 'First League', country: 'Czech Republic', apiFootballId: 345, over15GoalsRate: 0.86, over25GoalsRate: 0.69, avgGoalsPerMatch: 2.75 },

    // ==================== POLAND ====================
    { name: 'Ekstraklasa', country: 'Poland', apiFootballId: 106, over15GoalsRate: 0.85, over25GoalsRate: 0.67, avgGoalsPerMatch: 2.68 },
    { name: 'I Liga', country: 'Poland', apiFootballId: 107, over15GoalsRate: 0.82, over25GoalsRate: 0.63, avgGoalsPerMatch: 2.48 },

    // ==================== CROATIA ====================
    { name: 'HNL', country: 'Croatia', apiFootballId: 210, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.80 },

    // ==================== SERBIA ====================
    { name: 'Super Liga', country: 'Serbia', apiFootballId: 286, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.68 },

    // ==================== ROMANIA ====================
    { name: 'Liga 1', country: 'Romania', apiFootballId: 283, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.58 },

    // ==================== UKRAINE ====================
    { name: 'Premier League', country: 'Ukraine', apiFootballId: 333, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.65 },

    // ==================== RUSSIA ====================
    { name: 'Premier League', country: 'Russia', apiFootballId: 235, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.55 },

    // ==================== IRELAND ====================
    { name: 'Premier Division', country: 'Ireland', apiFootballId: 357, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.70 },

    // ==================== WALES ====================
    { name: 'Cymru Premier', country: 'Wales', apiFootballId: 110, over15GoalsRate: 0.87, over25GoalsRate: 0.72, avgGoalsPerMatch: 2.92 },

    // ==================== ASIA ====================
    { name: 'Pro League', country: 'Saudi Arabia', apiFootballId: 307, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.80 },
    { name: 'Kings Cup', country: 'Saudi Arabia', apiFootballId: 308, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.70 },
    { name: 'J1 League', country: 'Japan', apiFootballId: 98, over15GoalsRate: 0.86, over25GoalsRate: 0.69, avgGoalsPerMatch: 2.75 },
    { name: 'J2 League', country: 'Japan', apiFootballId: 99, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.62 },
    { name: 'K League 1', country: 'South Korea', apiFootballId: 292, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.70 },
    { name: 'Chinese Super League', country: 'China', apiFootballId: 169, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.58 },

    // ==================== OCEANIA ====================
    { name: 'A-League', country: 'Australia', apiFootballId: 188, over15GoalsRate: 0.88, over25GoalsRate: 0.73, avgGoalsPerMatch: 2.98 },

    // ==================== NORTH AMERICA ====================
    { name: 'MLS', country: 'USA', apiFootballId: 253, over15GoalsRate: 0.87, over25GoalsRate: 0.71, avgGoalsPerMatch: 2.88 },
    { name: 'Liga MX', country: 'Mexico', apiFootballId: 262, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.70 },

    // ==================== EUROPEAN COMPETITIONS ====================
    { name: 'Champions League', country: 'Europe', apiFootballId: 2, over15GoalsRate: 0.88, over25GoalsRate: 0.73, avgGoalsPerMatch: 2.95 },
    { name: 'Europa League', country: 'Europe', apiFootballId: 3, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.82 },
    { name: 'Conference League', country: 'Europe', apiFootballId: 848, over15GoalsRate: 0.87, over25GoalsRate: 0.71, avgGoalsPerMatch: 2.88 },

    // ==================== WOMEN'S FOOTBALL ====================
    { name: 'WSL', country: 'England Women', apiFootballId: 712, over15GoalsRate: 0.88, over25GoalsRate: 0.74, avgGoalsPerMatch: 3.05 },
    { name: 'Championship', country: 'England Women', apiFootballId: 713, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.85 },
    { name: 'UEFA Womens Champions League', country: 'Europe Women', apiFootballId: 750, over15GoalsRate: 0.89, over25GoalsRate: 0.76, avgGoalsPerMatch: 3.15 },

    // ==================== INTERNATIONAL ====================
    { name: 'World Cup', country: 'International', apiFootballId: 1, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.65 },
    { name: 'European Championship', country: 'International', apiFootballId: 4, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.58 },
    { name: 'Nations League', country: 'International', apiFootballId: 5, over15GoalsRate: 0.83, over25GoalsRate: 0.65, avgGoalsPerMatch: 2.52 },
    { name: 'Africa Cup of Nations', country: 'International', apiFootballId: 6, over15GoalsRate: 0.82, over25GoalsRate: 0.62, avgGoalsPerMatch: 2.42 },
    { name: 'Asian Cup', country: 'International', apiFootballId: 7, over15GoalsRate: 0.83, over25GoalsRate: 0.64, avgGoalsPerMatch: 2.48 },
    { name: 'Copa America', country: 'International', apiFootballId: 9, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.58 },
    { name: 'World Cup Qualifiers', country: 'International', apiFootballId: 32, over15GoalsRate: 0.83, over25GoalsRate: 0.65, avgGoalsPerMatch: 2.52 },
    { name: 'Friendlies', country: 'International', apiFootballId: 10, over15GoalsRate: 0.82, over25GoalsRate: 0.63, avgGoalsPerMatch: 2.45 },
  ];

  for (const league of leagues) {
    await prisma.league.create({ data: league });
  }
  console.log(`✅ Created ${leagues.length} leagues`);

  // ============================================================
  // MARKET TYPES - Organized for Easy Selection
  // Categories ordered by popularity/usefulness for betting
  // ============================================================
  const markets = [
    // ==================== 1. TOTAL GOALS (90 MINS) - MOST POPULAR ====================
    { name: 'Over 0.5 Goals', category: '1. Total Goals', baselineProbability: 0.96, typicalOddsLow: 1.01, typicalOddsHigh: 1.06 },
    { name: 'Under 0.5 Goals', category: '1. Total Goals', baselineProbability: 0.04, typicalOddsLow: 12.00, typicalOddsHigh: 20.00 },
    { name: 'Over 1.5 Goals', category: '1. Total Goals', baselineProbability: 0.87, typicalOddsLow: 1.08, typicalOddsHigh: 1.25 },
    { name: 'Under 1.5 Goals', category: '1. Total Goals', baselineProbability: 0.13, typicalOddsLow: 4.00, typicalOddsHigh: 7.50 },
    { name: 'Over 2.5 Goals', category: '1. Total Goals', baselineProbability: 0.72, typicalOddsLow: 1.40, typicalOddsHigh: 1.85 },
    { name: 'Under 2.5 Goals', category: '1. Total Goals', baselineProbability: 0.28, typicalOddsLow: 2.00, typicalOddsHigh: 2.80 },
    { name: 'Over 3.5 Goals', category: '1. Total Goals', baselineProbability: 0.48, typicalOddsLow: 1.80, typicalOddsHigh: 2.50 },
    { name: 'Under 3.5 Goals', category: '1. Total Goals', baselineProbability: 0.52, typicalOddsLow: 1.45, typicalOddsHigh: 1.75 },
    { name: 'Over 4.5 Goals', category: '1. Total Goals', baselineProbability: 0.28, typicalOddsLow: 2.80, typicalOddsHigh: 4.00 },
    { name: 'Under 4.5 Goals', category: '1. Total Goals', baselineProbability: 0.72, typicalOddsLow: 1.20, typicalOddsHigh: 1.40 },
    { name: 'Over 5.5 Goals', category: '1. Total Goals', baselineProbability: 0.15, typicalOddsLow: 4.50, typicalOddsHigh: 7.00 },
    { name: 'Under 5.5 Goals', category: '1. Total Goals', baselineProbability: 0.85, typicalOddsLow: 1.08, typicalOddsHigh: 1.20 },
    { name: 'Over 6.5 Goals', category: '1. Total Goals', baselineProbability: 0.07, typicalOddsLow: 8.00, typicalOddsHigh: 13.00 },
    { name: 'Under 6.5 Goals', category: '1. Total Goals', baselineProbability: 0.93, typicalOddsLow: 1.02, typicalOddsHigh: 1.10 },

    // ==================== 2. BTTS (BOTH TEAMS TO SCORE) ====================
    { name: 'BTTS Yes', category: '2. Both Teams To Score', baselineProbability: 0.52, typicalOddsLow: 1.57, typicalOddsHigh: 2.00 },
    { name: 'BTTS No', category: '2. Both Teams To Score', baselineProbability: 0.48, typicalOddsLow: 1.75, typicalOddsHigh: 2.30 },
    { name: 'BTTS Yes - Both Halves', category: '2. Both Teams To Score', baselineProbability: 0.12, typicalOddsLow: 7.00, typicalOddsHigh: 10.00 },
    { name: 'BTTS No - Both Halves', category: '2. Both Teams To Score', baselineProbability: 0.88, typicalOddsLow: 1.02, typicalOddsHigh: 1.08 },
    { name: 'BTTS Yes - 1st Half', category: '2. Both Teams To Score', baselineProbability: 0.28, typicalOddsLow: 2.80, typicalOddsHigh: 3.80 },
    { name: 'BTTS No - 1st Half', category: '2. Both Teams To Score', baselineProbability: 0.72, typicalOddsLow: 1.20, typicalOddsHigh: 1.40 },
    { name: 'BTTS Yes - 2nd Half', category: '2. Both Teams To Score', baselineProbability: 0.32, typicalOddsLow: 2.50, typicalOddsHigh: 3.20 },
    { name: 'BTTS No - 2nd Half', category: '2. Both Teams To Score', baselineProbability: 0.68, typicalOddsLow: 1.28, typicalOddsHigh: 1.50 },

    // ==================== 3. MATCH RESULT ====================
    { name: 'Home Win', category: '3. Match Result', baselineProbability: 0.45, typicalOddsLow: 1.50, typicalOddsHigh: 3.50 },
    { name: 'Draw', category: '3. Match Result', baselineProbability: 0.26, typicalOddsLow: 3.00, typicalOddsHigh: 4.00 },
    { name: 'Away Win', category: '3. Match Result', baselineProbability: 0.29, typicalOddsLow: 2.00, typicalOddsHigh: 5.00 },
    { name: 'Home Win - 1st Half', category: '3. Match Result', baselineProbability: 0.32, typicalOddsLow: 2.20, typicalOddsHigh: 3.80 },
    { name: 'Draw - 1st Half', category: '3. Match Result', baselineProbability: 0.42, typicalOddsLow: 2.10, typicalOddsHigh: 2.60 },
    { name: 'Away Win - 1st Half', category: '3. Match Result', baselineProbability: 0.26, typicalOddsLow: 3.00, typicalOddsHigh: 4.50 },
    { name: 'Home Win - 2nd Half', category: '3. Match Result', baselineProbability: 0.35, typicalOddsLow: 2.10, typicalOddsHigh: 3.20 },
    { name: 'Draw - 2nd Half', category: '3. Match Result', baselineProbability: 0.38, typicalOddsLow: 2.30, typicalOddsHigh: 2.90 },
    { name: 'Away Win - 2nd Half', category: '3. Match Result', baselineProbability: 0.27, typicalOddsLow: 2.80, typicalOddsHigh: 4.20 },

    // ==================== 4. DOUBLE CHANCE ====================
    { name: 'Home or Draw (1X)', category: '4. Double Chance', baselineProbability: 0.71, typicalOddsLow: 1.20, typicalOddsHigh: 1.55 },
    { name: 'Away or Draw (X2)', category: '4. Double Chance', baselineProbability: 0.55, typicalOddsLow: 1.45, typicalOddsHigh: 1.85 },
    { name: 'Home or Away (12)', category: '4. Double Chance', baselineProbability: 0.74, typicalOddsLow: 1.15, typicalOddsHigh: 1.45 },

    // ==================== 5. DRAW NO BET ====================
    { name: 'Draw No Bet - Home', category: '5. Draw No Bet', baselineProbability: 0.61, typicalOddsLow: 1.30, typicalOddsHigh: 2.00 },
    { name: 'Draw No Bet - Away', category: '5. Draw No Bet', baselineProbability: 0.39, typicalOddsLow: 1.60, typicalOddsHigh: 3.00 },

    // ==================== 6. BTTS + GOALS COMBOS ====================
    { name: 'BTTS Yes & Over 2.5 Goals', category: '6. BTTS & Goals', baselineProbability: 0.42, typicalOddsLow: 1.90, typicalOddsHigh: 2.40 },
    { name: 'BTTS Yes & Under 2.5 Goals', category: '6. BTTS & Goals', baselineProbability: 0.10, typicalOddsLow: 5.50, typicalOddsHigh: 8.00 },
    { name: 'BTTS No & Over 2.5 Goals', category: '6. BTTS & Goals', baselineProbability: 0.30, typicalOddsLow: 2.80, typicalOddsHigh: 4.00 },
    { name: 'BTTS No & Under 2.5 Goals', category: '6. BTTS & Goals', baselineProbability: 0.18, typicalOddsLow: 3.50, typicalOddsHigh: 5.50 },
    { name: 'BTTS Yes & Over 3.5 Goals', category: '6. BTTS & Goals', baselineProbability: 0.32, typicalOddsLow: 2.50, typicalOddsHigh: 3.50 },
    { name: 'BTTS Yes & Under 3.5 Goals', category: '6. BTTS & Goals', baselineProbability: 0.20, typicalOddsLow: 3.80, typicalOddsHigh: 5.50 },
    { name: 'BTTS Yes & Over 4.5 Goals', category: '6. BTTS & Goals', baselineProbability: 0.20, typicalOddsLow: 4.00, typicalOddsHigh: 6.00 },
    { name: 'BTTS Yes & Under 4.5 Goals', category: '6. BTTS & Goals', baselineProbability: 0.32, typicalOddsLow: 2.50, typicalOddsHigh: 3.50 },
    { name: 'BTTS Yes & Over 5.5 Goals', category: '6. BTTS & Goals', baselineProbability: 0.12, typicalOddsLow: 6.50, typicalOddsHigh: 10.00 },
    { name: 'BTTS Yes & Under 5.5 Goals', category: '6. BTTS & Goals', baselineProbability: 0.40, typicalOddsLow: 2.10, typicalOddsHigh: 2.80 },

    // ==================== 7. MATCH RESULT + GOALS ====================
    { name: 'Home Win & Over 1.5 Goals', category: '7. Result & Goals', baselineProbability: 0.40, typicalOddsLow: 2.10, typicalOddsHigh: 2.80 },
    { name: 'Home Win & Under 1.5 Goals', category: '7. Result & Goals', baselineProbability: 0.05, typicalOddsLow: 8.00, typicalOddsHigh: 12.00 },
    { name: 'Draw & Over 1.5 Goals', category: '7. Result & Goals', baselineProbability: 0.18, typicalOddsLow: 4.00, typicalOddsHigh: 5.50 },
    { name: 'Draw & Under 1.5 Goals', category: '7. Result & Goals', baselineProbability: 0.08, typicalOddsLow: 8.00, typicalOddsHigh: 13.00 },
    { name: 'Away Win & Over 1.5 Goals', category: '7. Result & Goals', baselineProbability: 0.25, typicalOddsLow: 3.20, typicalOddsHigh: 4.50 },
    { name: 'Away Win & Under 1.5 Goals', category: '7. Result & Goals', baselineProbability: 0.04, typicalOddsLow: 10.00, typicalOddsHigh: 15.00 },
    { name: 'Home Win & Over 2.5 Goals', category: '7. Result & Goals', baselineProbability: 0.32, typicalOddsLow: 2.50, typicalOddsHigh: 3.50 },
    { name: 'Home Win & Under 2.5 Goals', category: '7. Result & Goals', baselineProbability: 0.13, typicalOddsLow: 5.00, typicalOddsHigh: 8.00 },
    { name: 'Draw & Over 2.5 Goals', category: '7. Result & Goals', baselineProbability: 0.12, typicalOddsLow: 6.00, typicalOddsHigh: 10.00 },
    { name: 'Draw & Under 2.5 Goals', category: '7. Result & Goals', baselineProbability: 0.14, typicalOddsLow: 4.50, typicalOddsHigh: 7.00 },
    { name: 'Away Win & Over 2.5 Goals', category: '7. Result & Goals', baselineProbability: 0.20, typicalOddsLow: 4.00, typicalOddsHigh: 5.80 },
    { name: 'Away Win & Under 2.5 Goals', category: '7. Result & Goals', baselineProbability: 0.09, typicalOddsLow: 7.00, typicalOddsHigh: 11.00 },
    { name: 'Home Win & Over 3.5 Goals', category: '7. Result & Goals', baselineProbability: 0.22, typicalOddsLow: 3.50, typicalOddsHigh: 5.00 },
    { name: 'Home Win & Under 3.5 Goals', category: '7. Result & Goals', baselineProbability: 0.23, typicalOddsLow: 3.20, typicalOddsHigh: 4.80 },
    { name: 'Draw & Over 3.5 Goals', category: '7. Result & Goals', baselineProbability: 0.08, typicalOddsLow: 9.00, typicalOddsHigh: 15.00 },
    { name: 'Draw & Under 3.5 Goals', category: '7. Result & Goals', baselineProbability: 0.18, typicalOddsLow: 4.00, typicalOddsHigh: 6.00 },
    { name: 'Away Win & Over 3.5 Goals', category: '7. Result & Goals', baselineProbability: 0.14, typicalOddsLow: 5.50, typicalOddsHigh: 8.50 },
    { name: 'Away Win & Under 3.5 Goals', category: '7. Result & Goals', baselineProbability: 0.15, typicalOddsLow: 5.00, typicalOddsHigh: 7.50 },
    { name: 'Home Win & Over 4.5 Goals', category: '7. Result & Goals', baselineProbability: 0.14, typicalOddsLow: 5.50, typicalOddsHigh: 8.50 },
    { name: 'Home Win & Under 4.5 Goals', category: '7. Result & Goals', baselineProbability: 0.31, typicalOddsLow: 2.60, typicalOddsHigh: 3.80 },
    { name: 'Away Win & Over 4.5 Goals', category: '7. Result & Goals', baselineProbability: 0.10, typicalOddsLow: 7.50, typicalOddsHigh: 12.00 },
    { name: 'Away Win & Under 4.5 Goals', category: '7. Result & Goals', baselineProbability: 0.19, typicalOddsLow: 4.00, typicalOddsHigh: 6.00 },

    // ==================== 8. MATCH RESULT + BTTS ====================
    { name: 'Home Win & BTTS Yes', category: '8. Result & BTTS', baselineProbability: 0.24, typicalOddsLow: 3.20, typicalOddsHigh: 4.50 },
    { name: 'Home Win & BTTS No', category: '8. Result & BTTS', baselineProbability: 0.21, typicalOddsLow: 3.50, typicalOddsHigh: 5.00 },
    { name: 'Draw & BTTS Yes', category: '8. Result & BTTS', baselineProbability: 0.14, typicalOddsLow: 4.50, typicalOddsHigh: 6.50 },
    { name: 'Draw & BTTS No', category: '8. Result & BTTS', baselineProbability: 0.12, typicalOddsLow: 6.00, typicalOddsHigh: 9.00 },
    { name: 'Away Win & BTTS Yes', category: '8. Result & BTTS', baselineProbability: 0.16, typicalOddsLow: 4.80, typicalOddsHigh: 7.00 },
    { name: 'Away Win & BTTS No', category: '8. Result & BTTS', baselineProbability: 0.13, typicalOddsLow: 5.50, typicalOddsHigh: 8.50 },

    // ==================== 9. DOUBLE CHANCE + GOALS ====================
    { name: '1X & Over 1.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.62, typicalOddsLow: 1.40, typicalOddsHigh: 1.75 },
    { name: '1X & Under 1.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.09, typicalOddsLow: 7.00, typicalOddsHigh: 11.00 },
    { name: 'X2 & Over 1.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.48, typicalOddsLow: 1.75, typicalOddsHigh: 2.20 },
    { name: 'X2 & Under 1.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.07, typicalOddsLow: 9.00, typicalOddsHigh: 14.00 },
    { name: '12 & Over 1.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.67, typicalOddsLow: 1.30, typicalOddsHigh: 1.60 },
    { name: '12 & Under 1.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.07, typicalOddsLow: 9.00, typicalOddsHigh: 14.00 },
    { name: '1X & Over 2.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.48, typicalOddsLow: 1.75, typicalOddsHigh: 2.20 },
    { name: '1X & Under 2.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.23, typicalOddsLow: 3.20, typicalOddsHigh: 4.80 },
    { name: 'X2 & Over 2.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.35, typicalOddsLow: 2.30, typicalOddsHigh: 3.20 },
    { name: 'X2 & Under 2.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.20, typicalOddsLow: 3.80, typicalOddsHigh: 5.50 },
    { name: '12 & Over 2.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.55, typicalOddsLow: 1.55, typicalOddsHigh: 2.00 },
    { name: '12 & Under 2.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.19, typicalOddsLow: 4.00, typicalOddsHigh: 6.00 },
    { name: '1X & Over 3.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.32, typicalOddsLow: 2.50, typicalOddsHigh: 3.50 },
    { name: 'X2 & Over 3.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.24, typicalOddsLow: 3.30, typicalOddsHigh: 4.80 },
    { name: '12 & Over 3.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.40, typicalOddsLow: 2.10, typicalOddsHigh: 2.80 },
    { name: '1X & Over 4.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.20, typicalOddsLow: 4.00, typicalOddsHigh: 5.80 },
    { name: 'X2 & Over 4.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.15, typicalOddsLow: 5.00, typicalOddsHigh: 7.50 },
    { name: '12 & Over 4.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.26, typicalOddsLow: 3.00, typicalOddsHigh: 4.50 },

    // ==================== 10. DOUBLE CHANCE + BTTS ====================
    { name: '1X & BTTS Yes', category: '10. Double Chance & BTTS', baselineProbability: 0.38, typicalOddsLow: 2.20, typicalOddsHigh: 3.00 },
    { name: '1X & BTTS No', category: '10. Double Chance & BTTS', baselineProbability: 0.33, typicalOddsLow: 2.50, typicalOddsHigh: 3.50 },
    { name: 'X2 & BTTS Yes', category: '10. Double Chance & BTTS', baselineProbability: 0.30, typicalOddsLow: 2.70, typicalOddsHigh: 3.80 },
    { name: 'X2 & BTTS No', category: '10. Double Chance & BTTS', baselineProbability: 0.25, typicalOddsLow: 3.20, typicalOddsHigh: 4.50 },
    { name: '12 & BTTS Yes', category: '10. Double Chance & BTTS', baselineProbability: 0.38, typicalOddsLow: 2.20, typicalOddsHigh: 3.00 },
    { name: '12 & BTTS No', category: '10. Double Chance & BTTS', baselineProbability: 0.36, typicalOddsLow: 2.30, typicalOddsHigh: 3.20 },

    // ==================== 11. FIRST HALF GOALS ====================
    { name: '1H Over 0.5 Goals', category: '11. First Half Goals', baselineProbability: 0.82, typicalOddsLow: 1.12, typicalOddsHigh: 1.30 },
    { name: '1H Under 0.5 Goals', category: '11. First Half Goals', baselineProbability: 0.18, typicalOddsLow: 4.00, typicalOddsHigh: 6.00 },
    { name: '1H Over 1.5 Goals', category: '11. First Half Goals', baselineProbability: 0.48, typicalOddsLow: 1.80, typicalOddsHigh: 2.30 },
    { name: '1H Under 1.5 Goals', category: '11. First Half Goals', baselineProbability: 0.52, typicalOddsLow: 1.55, typicalOddsHigh: 1.95 },
    { name: '1H Over 2.5 Goals', category: '11. First Half Goals', baselineProbability: 0.18, typicalOddsLow: 4.00, typicalOddsHigh: 6.00 },
    { name: '1H Under 2.5 Goals', category: '11. First Half Goals', baselineProbability: 0.82, typicalOddsLow: 1.10, typicalOddsHigh: 1.25 },
    { name: '1H Over 3.5 Goals', category: '11. First Half Goals', baselineProbability: 0.06, typicalOddsLow: 10.00, typicalOddsHigh: 17.00 },
    { name: '1H Under 3.5 Goals', category: '11. First Half Goals', baselineProbability: 0.94, typicalOddsLow: 1.01, typicalOddsHigh: 1.06 },

    // ==================== 12. SECOND HALF GOALS ====================
    { name: '2H Over 0.5 Goals', category: '12. Second Half Goals', baselineProbability: 0.85, typicalOddsLow: 1.08, typicalOddsHigh: 1.25 },
    { name: '2H Under 0.5 Goals', category: '12. Second Half Goals', baselineProbability: 0.15, typicalOddsLow: 4.50, typicalOddsHigh: 7.00 },
    { name: '2H Over 1.5 Goals', category: '12. Second Half Goals', baselineProbability: 0.52, typicalOddsLow: 1.65, typicalOddsHigh: 2.10 },
    { name: '2H Under 1.5 Goals', category: '12. Second Half Goals', baselineProbability: 0.48, typicalOddsLow: 1.70, typicalOddsHigh: 2.15 },
    { name: '2H Over 2.5 Goals', category: '12. Second Half Goals', baselineProbability: 0.22, typicalOddsLow: 3.50, typicalOddsHigh: 5.50 },
    { name: '2H Under 2.5 Goals', category: '12. Second Half Goals', baselineProbability: 0.78, typicalOddsLow: 1.15, typicalOddsHigh: 1.35 },
    { name: '2H Over 3.5 Goals', category: '12. Second Half Goals', baselineProbability: 0.08, typicalOddsLow: 8.00, typicalOddsHigh: 14.00 },
    { name: '2H Under 3.5 Goals', category: '12. Second Half Goals', baselineProbability: 0.92, typicalOddsLow: 1.03, typicalOddsHigh: 1.10 },

    // ==================== 13. HOME TEAM GOALS ====================
    { name: 'Home Over 0.5 Goals', category: '13. Home Team Goals', baselineProbability: 0.80, typicalOddsLow: 1.15, typicalOddsHigh: 1.35 },
    { name: 'Home Under 0.5 Goals', category: '13. Home Team Goals', baselineProbability: 0.20, typicalOddsLow: 3.50, typicalOddsHigh: 5.50 },
    { name: 'Home Over 1.5 Goals', category: '13. Home Team Goals', baselineProbability: 0.52, typicalOddsLow: 1.65, typicalOddsHigh: 2.10 },
    { name: 'Home Under 1.5 Goals', category: '13. Home Team Goals', baselineProbability: 0.48, typicalOddsLow: 1.70, typicalOddsHigh: 2.15 },
    { name: 'Home Over 2.5 Goals', category: '13. Home Team Goals', baselineProbability: 0.28, typicalOddsLow: 2.60, typicalOddsHigh: 3.80 },
    { name: 'Home Under 2.5 Goals', category: '13. Home Team Goals', baselineProbability: 0.72, typicalOddsLow: 1.22, typicalOddsHigh: 1.45 },
    { name: 'Home Over 3.5 Goals', category: '13. Home Team Goals', baselineProbability: 0.12, typicalOddsLow: 5.50, typicalOddsHigh: 9.00 },
    { name: 'Home Under 3.5 Goals', category: '13. Home Team Goals', baselineProbability: 0.88, typicalOddsLow: 1.06, typicalOddsHigh: 1.18 },
    { name: 'Home To Score - Yes', category: '13. Home Team Goals', baselineProbability: 0.80, typicalOddsLow: 1.15, typicalOddsHigh: 1.35 },
    { name: 'Home To Score - No', category: '13. Home Team Goals', baselineProbability: 0.20, typicalOddsLow: 3.50, typicalOddsHigh: 5.50 },
    { name: 'Home Clean Sheet - Yes', category: '13. Home Team Goals', baselineProbability: 0.35, typicalOddsLow: 2.20, typicalOddsHigh: 3.00 },
    { name: 'Home Clean Sheet - No', category: '13. Home Team Goals', baselineProbability: 0.65, typicalOddsLow: 1.30, typicalOddsHigh: 1.55 },

    // ==================== 14. AWAY TEAM GOALS ====================
    { name: 'Away Over 0.5 Goals', category: '14. Away Team Goals', baselineProbability: 0.68, typicalOddsLow: 1.30, typicalOddsHigh: 1.55 },
    { name: 'Away Under 0.5 Goals', category: '14. Away Team Goals', baselineProbability: 0.32, typicalOddsLow: 2.30, typicalOddsHigh: 3.20 },
    { name: 'Away Over 1.5 Goals', category: '14. Away Team Goals', baselineProbability: 0.38, typicalOddsLow: 2.10, typicalOddsHigh: 2.80 },
    { name: 'Away Under 1.5 Goals', category: '14. Away Team Goals', baselineProbability: 0.62, typicalOddsLow: 1.40, typicalOddsHigh: 1.70 },
    { name: 'Away Over 2.5 Goals', category: '14. Away Team Goals', baselineProbability: 0.18, typicalOddsLow: 4.00, typicalOddsHigh: 6.00 },
    { name: 'Away Under 2.5 Goals', category: '14. Away Team Goals', baselineProbability: 0.82, typicalOddsLow: 1.10, typicalOddsHigh: 1.25 },
    { name: 'Away Over 3.5 Goals', category: '14. Away Team Goals', baselineProbability: 0.07, typicalOddsLow: 9.00, typicalOddsHigh: 15.00 },
    { name: 'Away Under 3.5 Goals', category: '14. Away Team Goals', baselineProbability: 0.93, typicalOddsLow: 1.03, typicalOddsHigh: 1.10 },
    { name: 'Away To Score - Yes', category: '14. Away Team Goals', baselineProbability: 0.68, typicalOddsLow: 1.30, typicalOddsHigh: 1.55 },
    { name: 'Away To Score - No', category: '14. Away Team Goals', baselineProbability: 0.32, typicalOddsLow: 2.30, typicalOddsHigh: 3.20 },
    { name: 'Away Clean Sheet - Yes', category: '14. Away Team Goals', baselineProbability: 0.25, typicalOddsLow: 2.80, typicalOddsHigh: 4.00 },
    { name: 'Away Clean Sheet - No', category: '14. Away Team Goals', baselineProbability: 0.75, typicalOddsLow: 1.18, typicalOddsHigh: 1.40 },

    // ==================== 15. HALF TIME / FULL TIME ====================
    { name: 'HT/FT: Home/Home', category: '15. Half Time / Full Time', baselineProbability: 0.25, typicalOddsLow: 3.00, typicalOddsHigh: 4.50 },
    { name: 'HT/FT: Home/Draw', category: '15. Half Time / Full Time', baselineProbability: 0.04, typicalOddsLow: 15.00, typicalOddsHigh: 26.00 },
    { name: 'HT/FT: Home/Away', category: '15. Half Time / Full Time', baselineProbability: 0.02, typicalOddsLow: 26.00, typicalOddsHigh: 51.00 },
    { name: 'HT/FT: Draw/Home', category: '15. Half Time / Full Time', baselineProbability: 0.14, typicalOddsLow: 5.00, typicalOddsHigh: 8.00 },
    { name: 'HT/FT: Draw/Draw', category: '15. Half Time / Full Time', baselineProbability: 0.12, typicalOddsLow: 5.50, typicalOddsHigh: 9.00 },
    { name: 'HT/FT: Draw/Away', category: '15. Half Time / Full Time', baselineProbability: 0.10, typicalOddsLow: 7.00, typicalOddsHigh: 12.00 },
    { name: 'HT/FT: Away/Home', category: '15. Half Time / Full Time', baselineProbability: 0.02, typicalOddsLow: 26.00, typicalOddsHigh: 51.00 },
    { name: 'HT/FT: Away/Draw', category: '15. Half Time / Full Time', baselineProbability: 0.04, typicalOddsLow: 17.00, typicalOddsHigh: 29.00 },
    { name: 'HT/FT: Away/Away', category: '15. Half Time / Full Time', baselineProbability: 0.17, typicalOddsLow: 4.50, typicalOddsHigh: 7.00 },

    // ==================== 16. FIRST TEAM TO SCORE ====================
    { name: 'First Goal - Home', category: '16. First Team To Score', baselineProbability: 0.50, typicalOddsLow: 1.60, typicalOddsHigh: 2.10 },
    { name: 'First Goal - Away', category: '16. First Team To Score', baselineProbability: 0.38, typicalOddsLow: 2.10, typicalOddsHigh: 2.80 },
    { name: 'First Goal - No Goal', category: '16. First Team To Score', baselineProbability: 0.04, typicalOddsLow: 12.00, typicalOddsHigh: 20.00 },
    { name: '1H First Goal - Home', category: '16. First Team To Score', baselineProbability: 0.40, typicalOddsLow: 2.00, typicalOddsHigh: 2.80 },
    { name: '1H First Goal - Away', category: '16. First Team To Score', baselineProbability: 0.30, typicalOddsLow: 2.60, typicalOddsHigh: 3.80 },
    { name: '1H First Goal - No Goal', category: '16. First Team To Score', baselineProbability: 0.18, typicalOddsLow: 4.00, typicalOddsHigh: 6.00 },
    { name: '2H First Goal - Home', category: '16. First Team To Score', baselineProbability: 0.38, typicalOddsLow: 2.20, typicalOddsHigh: 3.00 },
    { name: '2H First Goal - Away', category: '16. First Team To Score', baselineProbability: 0.30, typicalOddsLow: 2.70, typicalOddsHigh: 3.80 },
    { name: '2H First Goal - No Goal', category: '16. First Team To Score', baselineProbability: 0.15, typicalOddsLow: 4.50, typicalOddsHigh: 7.00 },

    // ==================== 17. HALF RESULT + GOALS ====================
    { name: '1H Home & Over 0.5 1H Goals', category: '17. Half Result & Goals', baselineProbability: 0.28, typicalOddsLow: 2.80, typicalOddsHigh: 4.00 },
    { name: '1H Draw & Over 0.5 1H Goals', category: '17. Half Result & Goals', baselineProbability: 0.25, typicalOddsLow: 3.00, typicalOddsHigh: 4.50 },
    { name: '1H Away & Over 0.5 1H Goals', category: '17. Half Result & Goals', baselineProbability: 0.20, typicalOddsLow: 3.80, typicalOddsHigh: 5.50 },
    { name: '1H Home & Over 1.5 1H Goals', category: '17. Half Result & Goals', baselineProbability: 0.16, typicalOddsLow: 4.50, typicalOddsHigh: 7.00 },
    { name: '1H Draw & Over 1.5 1H Goals', category: '17. Half Result & Goals', baselineProbability: 0.12, typicalOddsLow: 6.00, typicalOddsHigh: 10.00 },
    { name: '1H Away & Over 1.5 1H Goals', category: '17. Half Result & Goals', baselineProbability: 0.10, typicalOddsLow: 7.00, typicalOddsHigh: 12.00 },
    { name: '1H Home & Over 2.5 1H Goals', category: '17. Half Result & Goals', baselineProbability: 0.07, typicalOddsLow: 10.00, typicalOddsHigh: 17.00 },
    { name: '1H Away & Over 2.5 1H Goals', category: '17. Half Result & Goals', baselineProbability: 0.04, typicalOddsLow: 17.00, typicalOddsHigh: 29.00 },

    // ==================== 18. GOAL SPECIALS ====================
    { name: 'Goal Scored - Yes', category: '18. Goal Specials', baselineProbability: 0.96, typicalOddsLow: 1.01, typicalOddsHigh: 1.06 },
    { name: 'Goal Scored - No', category: '18. Goal Specials', baselineProbability: 0.04, typicalOddsLow: 12.00, typicalOddsHigh: 20.00 },
    { name: 'Home To Score In Both Halves - Yes', category: '18. Goal Specials', baselineProbability: 0.30, typicalOddsLow: 2.60, typicalOddsHigh: 3.80 },
    { name: 'Home To Score In Both Halves - No', category: '18. Goal Specials', baselineProbability: 0.70, typicalOddsLow: 1.28, typicalOddsHigh: 1.50 },
    { name: 'Away To Score In Both Halves - Yes', category: '18. Goal Specials', baselineProbability: 0.20, typicalOddsLow: 3.80, typicalOddsHigh: 5.50 },
    { name: 'Away To Score In Both Halves - No', category: '18. Goal Specials', baselineProbability: 0.80, typicalOddsLow: 1.12, typicalOddsHigh: 1.30 },
    { name: '2+ Goals In Both Halves - Yes', category: '18. Goal Specials', baselineProbability: 0.15, typicalOddsLow: 5.00, typicalOddsHigh: 8.00 },
    { name: '2+ Goals In Both Halves - No', category: '18. Goal Specials', baselineProbability: 0.85, typicalOddsLow: 1.08, typicalOddsHigh: 1.20 },
    { name: 'Which Half More Goals - 1st Half', category: '18. Goal Specials', baselineProbability: 0.32, typicalOddsLow: 2.50, typicalOddsHigh: 3.40 },
    { name: 'Which Half More Goals - 2nd Half', category: '18. Goal Specials', baselineProbability: 0.42, typicalOddsLow: 2.00, typicalOddsHigh: 2.60 },
    { name: 'Which Half More Goals - Equal', category: '18. Goal Specials', baselineProbability: 0.26, typicalOddsLow: 3.00, typicalOddsHigh: 4.20 },
    { name: 'Which Half First Goal - 1st Half', category: '18. Goal Specials', baselineProbability: 0.82, typicalOddsLow: 1.12, typicalOddsHigh: 1.28 },
    { name: 'Which Half First Goal - 2nd Half', category: '18. Goal Specials', baselineProbability: 0.14, typicalOddsLow: 5.00, typicalOddsHigh: 8.00 },
    { name: 'Which Half First Goal - No Goal', category: '18. Goal Specials', baselineProbability: 0.04, typicalOddsLow: 12.00, typicalOddsHigh: 20.00 },

    // ==================== 19. TOTAL GOALS EXACT ====================
    { name: 'Exact Goals - 0', category: '19. Total Goals Exact', baselineProbability: 0.04, typicalOddsLow: 12.00, typicalOddsHigh: 20.00 },
    { name: 'Exact Goals - 1', category: '19. Total Goals Exact', baselineProbability: 0.13, typicalOddsLow: 5.50, typicalOddsHigh: 9.00 },
    { name: 'Exact Goals - 2', category: '19. Total Goals Exact', baselineProbability: 0.22, typicalOddsLow: 3.50, typicalOddsHigh: 5.50 },
    { name: 'Exact Goals - 3', category: '19. Total Goals Exact', baselineProbability: 0.22, typicalOddsLow: 3.50, typicalOddsHigh: 5.50 },
    { name: 'Exact Goals - 4', category: '19. Total Goals Exact', baselineProbability: 0.17, typicalOddsLow: 4.50, typicalOddsHigh: 7.00 },
    { name: 'Exact Goals - 5', category: '19. Total Goals Exact', baselineProbability: 0.10, typicalOddsLow: 7.00, typicalOddsHigh: 11.00 },
    { name: 'Exact Goals - 6+', category: '19. Total Goals Exact', baselineProbability: 0.07, typicalOddsLow: 10.00, typicalOddsHigh: 17.00 },

    // ==================== 20. GOAL BANDS ====================
    { name: 'Goal Band - 0-1', category: '20. Goal Bands', baselineProbability: 0.17, typicalOddsLow: 4.50, typicalOddsHigh: 7.00 },
    { name: 'Goal Band - 2-3', category: '20. Goal Bands', baselineProbability: 0.44, typicalOddsLow: 1.90, typicalOddsHigh: 2.50 },
    { name: 'Goal Band - 4-5', category: '20. Goal Bands', baselineProbability: 0.27, typicalOddsLow: 2.80, typicalOddsHigh: 4.00 },
    { name: 'Goal Band - 6+', category: '20. Goal Bands', baselineProbability: 0.07, typicalOddsLow: 10.00, typicalOddsHigh: 17.00 },
    { name: 'Goal Band - 0-2', category: '20. Goal Bands', baselineProbability: 0.35, typicalOddsLow: 2.30, typicalOddsHigh: 3.20 },
    { name: 'Goal Band - 3-4', category: '20. Goal Bands', baselineProbability: 0.39, typicalOddsLow: 2.10, typicalOddsHigh: 2.80 },
    { name: 'Goal Band - 5+', category: '20. Goal Bands', baselineProbability: 0.15, typicalOddsLow: 5.00, typicalOddsHigh: 8.00 },
    { name: 'Goal Band - 4+', category: '20. Goal Bands', baselineProbability: 0.34, typicalOddsLow: 2.40, typicalOddsHigh: 3.30 },

    // ==================== 21. ODD/EVEN GOALS ====================
    { name: 'Total Goals - Odd', category: '21. Odd/Even Goals', baselineProbability: 0.48, typicalOddsLow: 1.85, typicalOddsHigh: 2.10 },
    { name: 'Total Goals - Even', category: '21. Odd/Even Goals', baselineProbability: 0.52, typicalOddsLow: 1.75, typicalOddsHigh: 2.00 },

    // ==================== 22. TO LEAD ====================
    { name: 'Home To Lead At Anytime', category: '22. To Lead', baselineProbability: 0.65, typicalOddsLow: 1.35, typicalOddsHigh: 1.65 },
    { name: 'Away To Lead At Anytime', category: '22. To Lead', baselineProbability: 0.52, typicalOddsLow: 1.65, typicalOddsHigh: 2.10 },

    // ==================== 23. WINNING MARGIN ====================
    { name: 'Home Win By 1 Goal', category: '23. Winning Margin', baselineProbability: 0.22, typicalOddsLow: 3.50, typicalOddsHigh: 5.00 },
    { name: 'Home Win By 2 Goals', category: '23. Winning Margin', baselineProbability: 0.13, typicalOddsLow: 5.50, typicalOddsHigh: 8.50 },
    { name: 'Home Win By 3+ Goals', category: '23. Winning Margin', baselineProbability: 0.10, typicalOddsLow: 7.00, typicalOddsHigh: 12.00 },
    { name: 'Away Win By 1 Goal', category: '23. Winning Margin', baselineProbability: 0.15, typicalOddsLow: 5.00, typicalOddsHigh: 7.50 },
    { name: 'Away Win By 2 Goals', category: '23. Winning Margin', baselineProbability: 0.08, typicalOddsLow: 9.00, typicalOddsHigh: 14.00 },
    { name: 'Away Win By 3+ Goals', category: '23. Winning Margin', baselineProbability: 0.05, typicalOddsLow: 13.00, typicalOddsHigh: 21.00 },
    { name: 'Match Won By 1 Goal', category: '23. Winning Margin', baselineProbability: 0.37, typicalOddsLow: 2.20, typicalOddsHigh: 3.00 },
    { name: 'Match Won By 2+ Goals', category: '23. Winning Margin', baselineProbability: 0.36, typicalOddsLow: 2.30, typicalOddsHigh: 3.10 },

    // ==================== 24. TO WIN HALF ====================
    { name: 'Home To Win Both Halves', category: '24. To Win Half', baselineProbability: 0.15, typicalOddsLow: 5.00, typicalOddsHigh: 7.50 },
    { name: 'Away To Win Both Halves', category: '24. To Win Half', baselineProbability: 0.08, typicalOddsLow: 9.00, typicalOddsHigh: 14.00 },
    { name: 'Home To Win Either Half', category: '24. To Win Half', baselineProbability: 0.55, typicalOddsLow: 1.55, typicalOddsHigh: 2.00 },
    { name: 'Away To Win Either Half', category: '24. To Win Half', baselineProbability: 0.42, typicalOddsLow: 2.00, typicalOddsHigh: 2.60 },

    // ==================== 25. COMEBACK ====================
    { name: 'Home To Win From Behind', category: '25. Comeback', baselineProbability: 0.08, typicalOddsLow: 9.00, typicalOddsHigh: 14.00 },
    { name: 'Away To Win From Behind', category: '25. Comeback', baselineProbability: 0.05, typicalOddsLow: 13.00, typicalOddsHigh: 21.00 },
    { name: 'Either Team To Win From Behind', category: '25. Comeback', baselineProbability: 0.13, typicalOddsLow: 5.50, typicalOddsHigh: 9.00 },
    { name: 'HT Lead & Fail To Win - Home', category: '25. Comeback', baselineProbability: 0.05, typicalOddsLow: 15.00, typicalOddsHigh: 26.00 },
    { name: 'HT Lead & Fail To Win - Away', category: '25. Comeback', baselineProbability: 0.04, typicalOddsLow: 17.00, typicalOddsHigh: 29.00 },

    // ==================== 26. ASIAN HANDICAP ====================
    { name: 'AH Home -0.5', category: '26. Asian Handicap', baselineProbability: 0.45, typicalOddsLow: 1.80, typicalOddsHigh: 2.20 },
    { name: 'AH Away +0.5', category: '26. Asian Handicap', baselineProbability: 0.55, typicalOddsLow: 1.60, typicalOddsHigh: 1.95 },
    { name: 'AH Home -1.0', category: '26. Asian Handicap', baselineProbability: 0.38, typicalOddsLow: 1.95, typicalOddsHigh: 2.40 },
    { name: 'AH Away +1.0', category: '26. Asian Handicap', baselineProbability: 0.62, typicalOddsLow: 1.50, typicalOddsHigh: 1.80 },
    { name: 'AH Home -1.5', category: '26. Asian Handicap', baselineProbability: 0.28, typicalOddsLow: 2.30, typicalOddsHigh: 3.00 },
    { name: 'AH Away +1.5', category: '26. Asian Handicap', baselineProbability: 0.72, typicalOddsLow: 1.35, typicalOddsHigh: 1.60 },
    { name: 'AH Home -2.0', category: '26. Asian Handicap', baselineProbability: 0.20, typicalOddsLow: 2.80, typicalOddsHigh: 4.00 },
    { name: 'AH Away +2.0', category: '26. Asian Handicap', baselineProbability: 0.80, typicalOddsLow: 1.18, typicalOddsHigh: 1.40 },
    { name: 'AH Home -2.5', category: '26. Asian Handicap', baselineProbability: 0.14, typicalOddsLow: 3.50, typicalOddsHigh: 5.50 },
    { name: 'AH Away +2.5', category: '26. Asian Handicap', baselineProbability: 0.86, typicalOddsLow: 1.08, typicalOddsHigh: 1.25 },
    { name: 'AH Away -0.5', category: '26. Asian Handicap', baselineProbability: 0.29, typicalOddsLow: 2.20, typicalOddsHigh: 3.00 },
    { name: 'AH Home +0.5', category: '26. Asian Handicap', baselineProbability: 0.71, typicalOddsLow: 1.30, typicalOddsHigh: 1.55 },
    { name: 'AH Away -1.0', category: '26. Asian Handicap', baselineProbability: 0.22, typicalOddsLow: 2.60, typicalOddsHigh: 3.80 },
    { name: 'AH Home +1.0', category: '26. Asian Handicap', baselineProbability: 0.78, typicalOddsLow: 1.18, typicalOddsHigh: 1.40 },
    { name: 'AH Away -1.5', category: '26. Asian Handicap', baselineProbability: 0.16, typicalOddsLow: 3.20, typicalOddsHigh: 5.00 },
    { name: 'AH Home +1.5', category: '26. Asian Handicap', baselineProbability: 0.84, typicalOddsLow: 1.10, typicalOddsHigh: 1.28 },
    { name: 'AH Away -2.0', category: '26. Asian Handicap', baselineProbability: 0.10, typicalOddsLow: 5.50, typicalOddsHigh: 9.00 },
    { name: 'AH Home +2.0', category: '26. Asian Handicap', baselineProbability: 0.90, typicalOddsLow: 1.05, typicalOddsHigh: 1.15 },

    // ==================== 27. CORNERS ====================
    { name: 'Over 7.5 Corners', category: '27. Corners', baselineProbability: 0.75, typicalOddsLow: 1.20, typicalOddsHigh: 1.45 },
    { name: 'Under 7.5 Corners', category: '27. Corners', baselineProbability: 0.25, typicalOddsLow: 2.80, typicalOddsHigh: 4.00 },
    { name: 'Over 8.5 Corners', category: '27. Corners', baselineProbability: 0.65, typicalOddsLow: 1.35, typicalOddsHigh: 1.65 },
    { name: 'Under 8.5 Corners', category: '27. Corners', baselineProbability: 0.35, typicalOddsLow: 2.20, typicalOddsHigh: 3.00 },
    { name: 'Over 9.5 Corners', category: '27. Corners', baselineProbability: 0.55, typicalOddsLow: 1.55, typicalOddsHigh: 1.95 },
    { name: 'Under 9.5 Corners', category: '27. Corners', baselineProbability: 0.45, typicalOddsLow: 1.85, typicalOddsHigh: 2.30 },
    { name: 'Over 10.5 Corners', category: '27. Corners', baselineProbability: 0.45, typicalOddsLow: 1.85, typicalOddsHigh: 2.30 },
    { name: 'Under 10.5 Corners', category: '27. Corners', baselineProbability: 0.55, typicalOddsLow: 1.55, typicalOddsHigh: 1.95 },
    { name: 'Over 11.5 Corners', category: '27. Corners', baselineProbability: 0.35, typicalOddsLow: 2.30, typicalOddsHigh: 3.20 },
    { name: 'Under 11.5 Corners', category: '27. Corners', baselineProbability: 0.65, typicalOddsLow: 1.35, typicalOddsHigh: 1.65 },
    { name: 'Over 12.5 Corners', category: '27. Corners', baselineProbability: 0.28, typicalOddsLow: 2.80, typicalOddsHigh: 4.00 },
    { name: 'Under 12.5 Corners', category: '27. Corners', baselineProbability: 0.72, typicalOddsLow: 1.22, typicalOddsHigh: 1.45 },
    { name: 'Over 13.5 Corners', category: '27. Corners', baselineProbability: 0.20, typicalOddsLow: 3.80, typicalOddsHigh: 5.50 },
    { name: 'Under 13.5 Corners', category: '27. Corners', baselineProbability: 0.80, typicalOddsLow: 1.12, typicalOddsHigh: 1.30 },
    { name: 'Most Corners - Home', category: '27. Corners', baselineProbability: 0.45, typicalOddsLow: 1.90, typicalOddsHigh: 2.40 },
    { name: 'Most Corners - Draw', category: '27. Corners', baselineProbability: 0.20, typicalOddsLow: 3.80, typicalOddsHigh: 5.50 },
    { name: 'Most Corners - Away', category: '27. Corners', baselineProbability: 0.35, typicalOddsLow: 2.30, typicalOddsHigh: 3.20 },

    // ==================== 28. CARDS ====================
    { name: 'Over 2.5 Cards', category: '28. Cards', baselineProbability: 0.78, typicalOddsLow: 1.15, typicalOddsHigh: 1.35 },
    { name: 'Under 2.5 Cards', category: '28. Cards', baselineProbability: 0.22, typicalOddsLow: 3.00, typicalOddsHigh: 4.50 },
    { name: 'Over 3.5 Cards', category: '28. Cards', baselineProbability: 0.65, typicalOddsLow: 1.35, typicalOddsHigh: 1.65 },
    { name: 'Under 3.5 Cards', category: '28. Cards', baselineProbability: 0.35, typicalOddsLow: 2.20, typicalOddsHigh: 3.00 },
    { name: 'Over 4.5 Cards', category: '28. Cards', baselineProbability: 0.52, typicalOddsLow: 1.65, typicalOddsHigh: 2.10 },
    { name: 'Under 4.5 Cards', category: '28. Cards', baselineProbability: 0.48, typicalOddsLow: 1.70, typicalOddsHigh: 2.15 },
    { name: 'Over 5.5 Cards', category: '28. Cards', baselineProbability: 0.40, typicalOddsLow: 2.10, typicalOddsHigh: 2.80 },
    { name: 'Under 5.5 Cards', category: '28. Cards', baselineProbability: 0.60, typicalOddsLow: 1.45, typicalOddsHigh: 1.80 },
    { name: 'Over 6.5 Cards', category: '28. Cards', baselineProbability: 0.28, typicalOddsLow: 2.80, typicalOddsHigh: 4.00 },
    { name: 'Under 6.5 Cards', category: '28. Cards', baselineProbability: 0.72, typicalOddsLow: 1.22, typicalOddsHigh: 1.45 },
    { name: 'Red Card - Yes', category: '28. Cards', baselineProbability: 0.08, typicalOddsLow: 8.00, typicalOddsHigh: 14.00 },
    { name: 'Red Card - No', category: '28. Cards', baselineProbability: 0.92, typicalOddsLow: 1.03, typicalOddsHigh: 1.10 },
    { name: 'Most Cards - Home', category: '28. Cards', baselineProbability: 0.42, typicalOddsLow: 2.00, typicalOddsHigh: 2.60 },
    { name: 'Most Cards - Draw', category: '28. Cards', baselineProbability: 0.25, typicalOddsLow: 3.00, typicalOddsHigh: 4.50 },
    { name: 'Most Cards - Away', category: '28. Cards', baselineProbability: 0.33, typicalOddsLow: 2.50, typicalOddsHigh: 3.40 },

    // ==================== 29. CORRECT SCORE (POPULAR) ====================
    { name: 'Correct Score 0-0', category: '29. Correct Score', baselineProbability: 0.04, typicalOddsLow: 12.00, typicalOddsHigh: 20.00 },
    { name: 'Correct Score 1-0', category: '29. Correct Score', baselineProbability: 0.08, typicalOddsLow: 8.00, typicalOddsHigh: 12.00 },
    { name: 'Correct Score 0-1', category: '29. Correct Score', baselineProbability: 0.06, typicalOddsLow: 10.00, typicalOddsHigh: 15.00 },
    { name: 'Correct Score 1-1', category: '29. Correct Score', baselineProbability: 0.10, typicalOddsLow: 6.50, typicalOddsHigh: 10.00 },
    { name: 'Correct Score 2-0', category: '29. Correct Score', baselineProbability: 0.07, typicalOddsLow: 10.00, typicalOddsHigh: 15.00 },
    { name: 'Correct Score 0-2', category: '29. Correct Score', baselineProbability: 0.04, typicalOddsLow: 15.00, typicalOddsHigh: 23.00 },
    { name: 'Correct Score 2-1', category: '29. Correct Score', baselineProbability: 0.08, typicalOddsLow: 9.00, typicalOddsHigh: 13.00 },
    { name: 'Correct Score 1-2', category: '29. Correct Score', baselineProbability: 0.05, typicalOddsLow: 12.00, typicalOddsHigh: 18.00 },
    { name: 'Correct Score 2-2', category: '29. Correct Score', baselineProbability: 0.04, typicalOddsLow: 15.00, typicalOddsHigh: 23.00 },
    { name: 'Correct Score 3-0', category: '29. Correct Score', baselineProbability: 0.04, typicalOddsLow: 17.00, typicalOddsHigh: 26.00 },
    { name: 'Correct Score 0-3', category: '29. Correct Score', baselineProbability: 0.02, typicalOddsLow: 26.00, typicalOddsHigh: 41.00 },
    { name: 'Correct Score 3-1', category: '29. Correct Score', baselineProbability: 0.04, typicalOddsLow: 17.00, typicalOddsHigh: 26.00 },
    { name: 'Correct Score 1-3', category: '29. Correct Score', baselineProbability: 0.03, typicalOddsLow: 21.00, typicalOddsHigh: 34.00 },
    { name: 'Correct Score 3-2', category: '29. Correct Score', baselineProbability: 0.03, typicalOddsLow: 23.00, typicalOddsHigh: 36.00 },
    { name: 'Correct Score 2-3', category: '29. Correct Score', baselineProbability: 0.02, typicalOddsLow: 29.00, typicalOddsHigh: 46.00 },
    { name: 'Correct Score 3-3', category: '29. Correct Score', baselineProbability: 0.01, typicalOddsLow: 51.00, typicalOddsHigh: 81.00 },
    { name: 'Correct Score 4-0', category: '29. Correct Score', baselineProbability: 0.02, typicalOddsLow: 34.00, typicalOddsHigh: 51.00 },
    { name: 'Correct Score 0-4', category: '29. Correct Score', baselineProbability: 0.01, typicalOddsLow: 67.00, typicalOddsHigh: 101.00 },
    { name: 'Correct Score 4-1', category: '29. Correct Score', baselineProbability: 0.02, typicalOddsLow: 34.00, typicalOddsHigh: 51.00 },
    { name: 'Correct Score 1-4', category: '29. Correct Score', baselineProbability: 0.01, typicalOddsLow: 51.00, typicalOddsHigh: 81.00 },
  ];

  for (const market of markets) {
    await prisma.marketType.create({ data: market });
  }
  console.log(`✅ Created ${markets.length} market types`);

  console.log('\n🎉 Seeding v2 completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });