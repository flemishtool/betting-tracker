import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

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
  // LEAGUES - European & Asian Only (No South America)
  // ============================================================
  const leagues = [
    // ENGLAND
    { name: 'Premier League', country: 'England', apiFootballId: 39, over15GoalsRate: 0.87, over25GoalsRate: 0.71, avgGoalsPerMatch: 2.85 },
    { name: 'Championship', country: 'England', apiFootballId: 40, over15GoalsRate: 0.86, over25GoalsRate: 0.69, avgGoalsPerMatch: 2.75 },
    { name: 'League One', country: 'England', apiFootballId: 41, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.70 },
    { name: 'League Two', country: 'England', apiFootballId: 42, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.62 },
    
    // SPAIN
    { name: 'La Liga', country: 'Spain', apiFootballId: 140, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.65 },
    { name: 'La Liga 2', country: 'Spain', apiFootballId: 141, over15GoalsRate: 0.82, over25GoalsRate: 0.62, avgGoalsPerMatch: 2.45 },
    
    // GERMANY
    { name: 'Bundesliga', country: 'Germany', apiFootballId: 78, over15GoalsRate: 0.91, over25GoalsRate: 0.78, avgGoalsPerMatch: 3.17 },
    { name: '2. Bundesliga', country: 'Germany', apiFootballId: 79, over15GoalsRate: 0.88, over25GoalsRate: 0.72, avgGoalsPerMatch: 2.95 },
    
    // ITALY
    { name: 'Serie A', country: 'Italy', apiFootballId: 135, over15GoalsRate: 0.84, over25GoalsRate: 0.67, avgGoalsPerMatch: 2.72 },
    { name: 'Serie B', country: 'Italy', apiFootballId: 136, over15GoalsRate: 0.82, over25GoalsRate: 0.63, avgGoalsPerMatch: 2.50 },
    
    // FRANCE
    { name: 'Ligue 1', country: 'France', apiFootballId: 61, over15GoalsRate: 0.83, over25GoalsRate: 0.65, avgGoalsPerMatch: 2.55 },
    { name: 'Ligue 2', country: 'France', apiFootballId: 62, over15GoalsRate: 0.81, over25GoalsRate: 0.61, avgGoalsPerMatch: 2.42 },
    
    // NETHERLANDS
    { name: 'Eredivisie', country: 'Netherlands', apiFootballId: 88, over15GoalsRate: 0.92, over25GoalsRate: 0.81, avgGoalsPerMatch: 3.35 },
    { name: 'Eerste Divisie', country: 'Netherlands', apiFootballId: 89, over15GoalsRate: 0.88, over25GoalsRate: 0.73, avgGoalsPerMatch: 2.95 },
    
    // PORTUGAL
    { name: 'Primeira Liga', country: 'Portugal', apiFootballId: 94, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.68 },
    
    // BELGIUM
    { name: 'Pro League', country: 'Belgium', apiFootballId: 144, over15GoalsRate: 0.88, over25GoalsRate: 0.72, avgGoalsPerMatch: 2.95 },
    
    // SCOTLAND
    { name: 'Premiership', country: 'Scotland', apiFootballId: 179, over15GoalsRate: 0.88, over25GoalsRate: 0.72, avgGoalsPerMatch: 2.90 },
    
    // TURKEY
    { name: 'Süper Lig', country: 'Turkey', apiFootballId: 203, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.78 },
    
    // RUSSIA
    { name: 'Premier League', country: 'Russia', apiFootballId: 235, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.55 },
    
    // UKRAINE
    { name: 'Premier League', country: 'Ukraine', apiFootballId: 333, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.65 },
    
    // AUSTRIA
    { name: 'Bundesliga', country: 'Austria', apiFootballId: 218, over15GoalsRate: 0.89, over25GoalsRate: 0.74, avgGoalsPerMatch: 3.05 },
    
    // SWITZERLAND
    { name: 'Super League', country: 'Switzerland', apiFootballId: 207, over15GoalsRate: 0.87, over25GoalsRate: 0.71, avgGoalsPerMatch: 2.88 },
    
    // GREECE
    { name: 'Super League', country: 'Greece', apiFootballId: 197, over15GoalsRate: 0.83, over25GoalsRate: 0.64, avgGoalsPerMatch: 2.48 },
    
    // DENMARK
    { name: 'Superliga', country: 'Denmark', apiFootballId: 119, over15GoalsRate: 0.88, over25GoalsRate: 0.73, avgGoalsPerMatch: 2.98 },
    
    // NORWAY
    { name: 'Eliteserien', country: 'Norway', apiFootballId: 103, over15GoalsRate: 0.89, over25GoalsRate: 0.75, avgGoalsPerMatch: 3.08 },
    
    // SWEDEN
    { name: 'Allsvenskan', country: 'Sweden', apiFootballId: 113, over15GoalsRate: 0.87, over25GoalsRate: 0.72, avgGoalsPerMatch: 2.92 },
    
    // CZECH REPUBLIC
    { name: 'First League', country: 'Czech Republic', apiFootballId: 345, over15GoalsRate: 0.86, over25GoalsRate: 0.69, avgGoalsPerMatch: 2.75 },
    
    // POLAND
    { name: 'Ekstraklasa', country: 'Poland', apiFootballId: 106, over15GoalsRate: 0.85, over25GoalsRate: 0.67, avgGoalsPerMatch: 2.68 },
    
    // CROATIA
    { name: 'HNL', country: 'Croatia', apiFootballId: 210, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.80 },
    
    // SERBIA
    { name: 'Super Liga', country: 'Serbia', apiFootballId: 286, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.68 },
    
    // ROMANIA
    { name: 'Liga 1', country: 'Romania', apiFootballId: 283, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.58 },
    
    // SAUDI ARABIA
    { name: 'Pro League', country: 'Saudi Arabia', apiFootballId: 307, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.80 },
    
    // JAPAN
    { name: 'J1 League', country: 'Japan', apiFootballId: 98, over15GoalsRate: 0.86, over25GoalsRate: 0.69, avgGoalsPerMatch: 2.75 },
    
    // SOUTH KOREA
    { name: 'K League 1', country: 'South Korea', apiFootballId: 292, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.70 },
    
    // AUSTRALIA
    { name: 'A-League', country: 'Australia', apiFootballId: 188, over15GoalsRate: 0.88, over25GoalsRate: 0.73, avgGoalsPerMatch: 2.98 },
    
    // USA
    { name: 'MLS', country: 'USA', apiFootballId: 253, over15GoalsRate: 0.87, over25GoalsRate: 0.71, avgGoalsPerMatch: 2.88 },
    
    // ============================================================
    // INTERNATIONAL COMPETITIONS
    // ============================================================
    { name: 'Champions League', country: 'Europe', apiFootballId: 2, over15GoalsRate: 0.88, over25GoalsRate: 0.73, avgGoalsPerMatch: 2.95 },
    { name: 'Europa League', country: 'Europe', apiFootballId: 3, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.82 },
    { name: 'Conference League', country: 'Europe', apiFootballId: 848, over15GoalsRate: 0.87, over25GoalsRate: 0.71, avgGoalsPerMatch: 2.88 },
    { name: 'World Cup', country: 'International', apiFootballId: 1, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.65 },
    { name: 'European Championship', country: 'International', apiFootballId: 4, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.58 },
    { name: 'Nations League', country: 'International', apiFootballId: 5, over15GoalsRate: 0.83, over25GoalsRate: 0.65, avgGoalsPerMatch: 2.52 },
    { name: 'Africa Cup of Nations', country: 'International', apiFootballId: 6, over15GoalsRate: 0.82, over25GoalsRate: 0.62, avgGoalsPerMatch: 2.42 },
    { name: 'Asian Cup', country: 'International', apiFootballId: 7, over15GoalsRate: 0.83, over25GoalsRate: 0.64, avgGoalsPerMatch: 2.48 },
  ];

  for (const league of leagues) {
    await prisma.league.create({ data: league });
  }
  console.log(`✅ Created ${leagues.length} leagues`);

  // ============================================================
  // MARKET TYPES
  // ============================================================
  const markets = [
    // GOALS - OVER
    { name: 'Over 0.5 Goals', category: 'Goals - Over', baselineProbability: 0.96, typicalOddsLow: 1.01, typicalOddsHigh: 1.06 },
    { name: 'Over 1.5 Goals', category: 'Goals - Over', baselineProbability: 0.87, typicalOddsLow: 1.08, typicalOddsHigh: 1.25 },
    { name: 'Over 2.5 Goals', category: 'Goals - Over', baselineProbability: 0.72, typicalOddsLow: 1.40, typicalOddsHigh: 1.85 },
    { name: 'Over 3.5 Goals', category: 'Goals - Over', baselineProbability: 0.48, typicalOddsLow: 1.80, typicalOddsHigh: 2.50 },
    { name: 'Over 4.5 Goals', category: 'Goals - Over', baselineProbability: 0.28, typicalOddsLow: 2.80, typicalOddsHigh: 4.00 },
    { name: 'Over 5.5 Goals', category: 'Goals - Over', baselineProbability: 0.15, typicalOddsLow: 4.50, typicalOddsHigh: 7.00 },
    { name: 'Over 6.5 Goals', category: 'Goals - Over', baselineProbability: 0.07, typicalOddsLow: 8.00, typicalOddsHigh: 13.00 },
    
    // GOALS - UNDER
    { name: 'Under 0.5 Goals', category: 'Goals - Under', baselineProbability: 0.04, typicalOddsLow: 12.00, typicalOddsHigh: 20.00 },
    { name: 'Under 1.5 Goals', category: 'Goals - Under', baselineProbability: 0.13, typicalOddsLow: 4.50, typicalOddsHigh: 7.50 },
    { name: 'Under 2.5 Goals', category: 'Goals - Under', baselineProbability: 0.28, typicalOddsLow: 2.10, typicalOddsHigh: 2.80 },
    { name: 'Under 3.5 Goals', category: 'Goals - Under', baselineProbability: 0.52, typicalOddsLow: 1.45, typicalOddsHigh: 1.75 },
    { name: 'Under 4.5 Goals', category: 'Goals - Under', baselineProbability: 0.72, typicalOddsLow: 1.20, typicalOddsHigh: 1.40 },
    { name: 'Under 5.5 Goals', category: 'Goals - Under', baselineProbability: 0.85, typicalOddsLow: 1.08, typicalOddsHigh: 1.20 },
    { name: 'Under 6.5 Goals', category: 'Goals - Under', baselineProbability: 0.93, typicalOddsLow: 1.02, typicalOddsHigh: 1.10 },
    
    // BTTS
    { name: 'BTTS Yes', category: 'BTTS', baselineProbability: 0.52, typicalOddsLow: 1.65, typicalOddsHigh: 2.00 },
    { name: 'BTTS No', category: 'BTTS', baselineProbability: 0.48, typicalOddsLow: 1.75, typicalOddsHigh: 2.15 },
    { name: 'BTTS Yes & Over 2.5', category: 'BTTS', baselineProbability: 0.42, typicalOddsLow: 1.90, typicalOddsHigh: 2.40 },
    { name: 'BTTS Yes & Under 3.5', category: 'BTTS', baselineProbability: 0.35, typicalOddsLow: 2.20, typicalOddsHigh: 2.80 },
    { name: 'BTTS No & Under 2.5', category: 'BTTS', baselineProbability: 0.22, typicalOddsLow: 3.00, typicalOddsHigh: 4.00 },
    
    // MATCH RESULT
    { name: 'Home Win', category: 'Match Result', baselineProbability: 0.45, typicalOddsLow: 1.50, typicalOddsHigh: 3.50 },
    { name: 'Draw', category: 'Match Result', baselineProbability: 0.26, typicalOddsLow: 3.00, typicalOddsHigh: 4.00 },
    { name: 'Away Win', category: 'Match Result', baselineProbability: 0.29, typicalOddsLow: 2.00, typicalOddsHigh: 5.00 },
    
    // DOUBLE CHANCE
    { name: 'Home or Draw (1X)', category: 'Double Chance', baselineProbability: 0.71, typicalOddsLow: 1.20, typicalOddsHigh: 1.55 },
    { name: 'Away or Draw (X2)', category: 'Double Chance', baselineProbability: 0.55, typicalOddsLow: 1.45, typicalOddsHigh: 1.85 },
    { name: 'Home or Away (12)', category: 'Double Chance', baselineProbability: 0.74, typicalOddsLow: 1.15, typicalOddsHigh: 1.45 },
    
    // DRAW NO BET
    { name: 'Draw No Bet - Home', category: 'Draw No Bet', baselineProbability: 0.61, typicalOddsLow: 1.30, typicalOddsHigh: 2.00 },
    { name: 'Draw No Bet - Away', category: 'Draw No Bet', baselineProbability: 0.39, typicalOddsLow: 1.60, typicalOddsHigh: 3.00 },
    
    // ASIAN HANDICAP
    { name: 'AH -0.5 Home', category: 'Asian Handicap', baselineProbability: 0.45, typicalOddsLow: 1.80, typicalOddsHigh: 2.20 },
    { name: 'AH -1.0 Home', category: 'Asian Handicap', baselineProbability: 0.38, typicalOddsLow: 1.95, typicalOddsHigh: 2.40 },
    { name: 'AH -1.5 Home', category: 'Asian Handicap', baselineProbability: 0.28, typicalOddsLow: 2.30, typicalOddsHigh: 3.00 },
    { name: 'AH -2.0 Home', category: 'Asian Handicap', baselineProbability: 0.20, typicalOddsLow: 2.80, typicalOddsHigh: 4.00 },
    { name: 'AH -2.5 Home', category: 'Asian Handicap', baselineProbability: 0.14, typicalOddsLow: 3.50, typicalOddsHigh: 5.50 },
    { name: 'AH +0.5 Home', category: 'Asian Handicap', baselineProbability: 0.71, typicalOddsLow: 1.20, typicalOddsHigh: 1.55 },
    { name: 'AH +1.0 Home', category: 'Asian Handicap', baselineProbability: 0.78, typicalOddsLow: 1.10, typicalOddsHigh: 1.40 },
    { name: 'AH +1.5 Home', category: 'Asian Handicap', baselineProbability: 0.85, typicalOddsLow: 1.05, typicalOddsHigh: 1.25 },
    { name: 'AH -0.5 Away', category: 'Asian Handicap', baselineProbability: 0.29, typicalOddsLow: 2.20, typicalOddsHigh: 3.00 },
    { name: 'AH -1.0 Away', category: 'Asian Handicap', baselineProbability: 0.22, typicalOddsLow: 2.60, typicalOddsHigh: 3.80 },
    { name: 'AH -1.5 Away', category: 'Asian Handicap', baselineProbability: 0.16, typicalOddsLow: 3.20, typicalOddsHigh: 5.00 },
    { name: 'AH +0.5 Away', category: 'Asian Handicap', baselineProbability: 0.55, typicalOddsLow: 1.50, typicalOddsHigh: 1.90 },
    { name: 'AH +1.0 Away', category: 'Asian Handicap', baselineProbability: 0.65, typicalOddsLow: 1.35, typicalOddsHigh: 1.65 },
    { name: 'AH +1.5 Away', category: 'Asian Handicap', baselineProbability: 0.72, typicalOddsLow: 1.22, typicalOddsHigh: 1.50 },
    
    // ASIAN TOTAL
    { name: 'Asian Over 1.5', category: 'Asian Total', baselineProbability: 0.87, typicalOddsLow: 1.08, typicalOddsHigh: 1.22 },
    { name: 'Asian Under 1.5', category: 'Asian Total', baselineProbability: 0.13, typicalOddsLow: 4.50, typicalOddsHigh: 7.00 },
    { name: 'Asian Over 2.0', category: 'Asian Total', baselineProbability: 0.80, typicalOddsLow: 1.15, typicalOddsHigh: 1.35 },
    { name: 'Asian Under 2.0', category: 'Asian Total', baselineProbability: 0.20, typicalOddsLow: 3.20, typicalOddsHigh: 5.00 },
    { name: 'Asian Over 2.5', category: 'Asian Total', baselineProbability: 0.72, typicalOddsLow: 1.25, typicalOddsHigh: 1.55 },
    { name: 'Asian Under 2.5', category: 'Asian Total', baselineProbability: 0.28, typicalOddsLow: 2.50, typicalOddsHigh: 3.50 },
    { name: 'Asian Over 3.0', category: 'Asian Total', baselineProbability: 0.58, typicalOddsLow: 1.45, typicalOddsHigh: 1.85 },
    { name: 'Asian Under 3.0', category: 'Asian Total', baselineProbability: 0.42, typicalOddsLow: 1.90, typicalOddsHigh: 2.50 },
    { name: 'Asian Over 3.5', category: 'Asian Total', baselineProbability: 0.48, typicalOddsLow: 1.70, typicalOddsHigh: 2.20 },
    { name: 'Asian Under 3.5', category: 'Asian Total', baselineProbability: 0.52, typicalOddsLow: 1.60, typicalOddsHigh: 2.00 },
    
    // FIRST HALF
    { name: '1H Over 0.5 Goals', category: 'First Half', baselineProbability: 0.82, typicalOddsLow: 1.12, typicalOddsHigh: 1.30 },
    { name: '1H Over 1.5 Goals', category: 'First Half', baselineProbability: 0.48, typicalOddsLow: 1.80, typicalOddsHigh: 2.30 },
    { name: '1H Over 2.5 Goals', category: 'First Half', baselineProbability: 0.18, typicalOddsLow: 4.00, typicalOddsHigh: 6.00 },
    { name: '1H Under 0.5 Goals', category: 'First Half', baselineProbability: 0.18, typicalOddsLow: 4.00, typicalOddsHigh: 6.00 },
    { name: '1H Under 1.5 Goals', category: 'First Half', baselineProbability: 0.52, typicalOddsLow: 1.65, typicalOddsHigh: 2.00 },
    { name: '1H BTTS Yes', category: 'First Half', baselineProbability: 0.28, typicalOddsLow: 2.80, typicalOddsHigh: 3.80 },
    
    // SECOND HALF
    { name: '2H Over 0.5 Goals', category: 'Second Half', baselineProbability: 0.85, typicalOddsLow: 1.08, typicalOddsHigh: 1.25 },
    { name: '2H Over 1.5 Goals', category: 'Second Half', baselineProbability: 0.52, typicalOddsLow: 1.65, typicalOddsHigh: 2.10 },
    { name: '2H Over 2.5 Goals', category: 'Second Half', baselineProbability: 0.22, typicalOddsLow: 3.50, typicalOddsHigh: 5.50 },
    
    // TEAM GOALS
    { name: 'Home Team Over 0.5', category: 'Team Goals', baselineProbability: 0.80, typicalOddsLow: 1.15, typicalOddsHigh: 1.35 },
    { name: 'Home Team Over 1.5', category: 'Team Goals', baselineProbability: 0.52, typicalOddsLow: 1.65, typicalOddsHigh: 2.10 },
    { name: 'Home Team Over 2.5', category: 'Team Goals', baselineProbability: 0.28, typicalOddsLow: 2.60, typicalOddsHigh: 3.80 },
    { name: 'Away Team Over 0.5', category: 'Team Goals', baselineProbability: 0.68, typicalOddsLow: 1.30, typicalOddsHigh: 1.55 },
    { name: 'Away Team Over 1.5', category: 'Team Goals', baselineProbability: 0.38, typicalOddsLow: 2.10, typicalOddsHigh: 2.80 },
    { name: 'Away Team Over 2.5', category: 'Team Goals', baselineProbability: 0.18, typicalOddsLow: 4.00, typicalOddsHigh: 6.00 },
    { name: 'Home Clean Sheet', category: 'Team Goals', baselineProbability: 0.35, typicalOddsLow: 2.20, typicalOddsHigh: 3.00 },
    { name: 'Away Clean Sheet', category: 'Team Goals', baselineProbability: 0.25, typicalOddsLow: 2.80, typicalOddsHigh: 4.00 },
    
    // CARDS
    { name: 'Over 0.5 Cards', category: 'Cards', baselineProbability: 0.96, typicalOddsLow: 1.01, typicalOddsHigh: 1.06 },
    { name: 'Over 1.5 Cards', category: 'Cards', baselineProbability: 0.88, typicalOddsLow: 1.06, typicalOddsHigh: 1.18 },
    { name: 'Over 2.5 Cards', category: 'Cards', baselineProbability: 0.78, typicalOddsLow: 1.15, typicalOddsHigh: 1.35 },
    { name: 'Over 3.5 Cards', category: 'Cards', baselineProbability: 0.65, typicalOddsLow: 1.35, typicalOddsHigh: 1.65 },
    { name: 'Over 4.5 Cards', category: 'Cards', baselineProbability: 0.52, typicalOddsLow: 1.65, typicalOddsHigh: 2.10 },
    { name: 'Over 5.5 Cards', category: 'Cards', baselineProbability: 0.40, typicalOddsLow: 2.10, typicalOddsHigh: 2.80 },
    { name: 'Over 6.5 Cards', category: 'Cards', baselineProbability: 0.28, typicalOddsLow: 2.80, typicalOddsHigh: 4.00 },
    
    // CORNERS
    { name: 'Over 6.5 Corners', category: 'Corners', baselineProbability: 0.85, typicalOddsLow: 1.08, typicalOddsHigh: 1.25 },
    { name: 'Over 7.5 Corners', category: 'Corners', baselineProbability: 0.75, typicalOddsLow: 1.20, typicalOddsHigh: 1.45 },
    { name: 'Over 8.5 Corners', category: 'Corners', baselineProbability: 0.65, typicalOddsLow: 1.40, typicalOddsHigh: 1.75 },
    { name: 'Over 9.5 Corners', category: 'Corners', baselineProbability: 0.55, typicalOddsLow: 1.60, typicalOddsHigh: 2.00 },
    { name: 'Over 10.5 Corners', category: 'Corners', baselineProbability: 0.45, typicalOddsLow: 1.85, typicalOddsHigh: 2.40 },
    { name: 'Over 11.5 Corners', category: 'Corners', baselineProbability: 0.35, typicalOddsLow: 2.30, typicalOddsHigh: 3.20 },
    { name: 'Over 12.5 Corners', category: 'Corners', baselineProbability: 0.28, typicalOddsLow: 2.80, typicalOddsHigh: 4.00 },
    { name: 'Under 8.5 Corners', category: 'Corners', baselineProbability: 0.35, typicalOddsLow: 2.20, typicalOddsHigh: 3.00 },
    { name: 'Under 9.5 Corners', category: 'Corners', baselineProbability: 0.45, typicalOddsLow: 1.85, typicalOddsHigh: 2.40 },
    { name: 'Under 10.5 Corners', category: 'Corners', baselineProbability: 0.55, typicalOddsLow: 1.55, typicalOddsHigh: 1.95 },
  ];

  for (const market of markets) {
    await prisma.marketType.create({ data: market });
  }
  console.log(`✅ Created ${markets.length} market types`);

  console.log('\n🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });