import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedExpandedMarkets() {
  console.log('🌱 Seeding expanded markets...');

  const markets = [
    // ==================== GOALS - MATCH ====================
    { name: 'Over 0.5 Goals', category: 'Goals', baselineProbability: 0.96 },
    { name: 'Over 1.5 Goals', category: 'Goals', baselineProbability: 0.78 },
    { name: 'Over 2.5 Goals', category: 'Goals', baselineProbability: 0.55 },
    { name: 'Over 3.5 Goals', category: 'Goals', baselineProbability: 0.35 },
    { name: 'Over 4.5 Goals', category: 'Goals', baselineProbability: 0.18 },
    { name: 'Over 5.5 Goals', category: 'Goals', baselineProbability: 0.08 },
    { name: 'Over 6.5 Goals', category: 'Goals', baselineProbability: 0.04 },
    { name: 'Under 0.5 Goals', category: 'Goals', baselineProbability: 0.04 },
    { name: 'Under 1.5 Goals', category: 'Goals', baselineProbability: 0.22 },
    { name: 'Under 2.5 Goals', category: 'Goals', baselineProbability: 0.45 },
    { name: 'Under 3.5 Goals', category: 'Goals', baselineProbability: 0.65 },
    { name: 'Under 4.5 Goals', category: 'Goals', baselineProbability: 0.82 },
    { name: 'Under 5.5 Goals', category: 'Goals', baselineProbability: 0.92 },

    // ==================== BTTS ====================
    { name: 'BTTS Yes', category: 'BTTS', baselineProbability: 0.52 },
    { name: 'BTTS No', category: 'BTTS', baselineProbability: 0.48 },
    { name: 'BTTS Yes & Over 2.5', category: 'BTTS Combo', baselineProbability: 0.38 },
    { name: 'BTTS Yes & Under 3.5', category: 'BTTS Combo', baselineProbability: 0.40 },
    { name: 'BTTS Yes & Over 3.5', category: 'BTTS Combo', baselineProbability: 0.22 },
    { name: 'BTTS No & Under 2.5', category: 'BTTS Combo', baselineProbability: 0.25 },
    { name: 'BTTS No & Over 2.5', category: 'BTTS Combo', baselineProbability: 0.12 },

    // ==================== MATCH RESULT ====================
    { name: 'Home Win', category: 'Match Result', baselineProbability: 0.45 },
    { name: 'Draw', category: 'Match Result', baselineProbability: 0.26 },
    { name: 'Away Win', category: 'Match Result', baselineProbability: 0.29 },
    { name: 'Home or Draw', category: 'Double Chance', baselineProbability: 0.71 },
    { name: 'Away or Draw', category: 'Double Chance', baselineProbability: 0.55 },
    { name: 'Home or Away', category: 'Double Chance', baselineProbability: 0.74 },
    { name: 'Draw No Bet - Home', category: 'Draw No Bet', baselineProbability: 0.61 },
    { name: 'Draw No Bet - Away', category: 'Draw No Bet', baselineProbability: 0.39 },

    // ==================== ASIAN HANDICAP ====================
    { name: 'AH 0 Home', category: 'Asian Handicap', baselineProbability: 0.61 },
    { name: 'AH 0 Away', category: 'Asian Handicap', baselineProbability: 0.39 },
    { name: 'AH -0.25 Home', category: 'Asian Handicap', baselineProbability: 0.53 },
    { name: 'AH +0.25 Away', category: 'Asian Handicap', baselineProbability: 0.47 },
    { name: 'AH -0.5 Home', category: 'Asian Handicap', baselineProbability: 0.45 },
    { name: 'AH +0.5 Away', category: 'Asian Handicap', baselineProbability: 0.55 },
    { name: 'AH -0.75 Home', category: 'Asian Handicap', baselineProbability: 0.38 },
    { name: 'AH +0.75 Away', category: 'Asian Handicap', baselineProbability: 0.62 },
    { name: 'AH -1.0 Home', category: 'Asian Handicap', baselineProbability: 0.32 },
    { name: 'AH +1.0 Away', category: 'Asian Handicap', baselineProbability: 0.68 },
    { name: 'AH -1.25 Home', category: 'Asian Handicap', baselineProbability: 0.27 },
    { name: 'AH +1.25 Away', category: 'Asian Handicap', baselineProbability: 0.73 },
    { name: 'AH -1.5 Home', category: 'Asian Handicap', baselineProbability: 0.23 },
    { name: 'AH +1.5 Away', category: 'Asian Handicap', baselineProbability: 0.77 },
    { name: 'AH -1.75 Home', category: 'Asian Handicap', baselineProbability: 0.18 },
    { name: 'AH +1.75 Away', category: 'Asian Handicap', baselineProbability: 0.82 },
    { name: 'AH -2.0 Home', category: 'Asian Handicap', baselineProbability: 0.15 },
    { name: 'AH +2.0 Away', category: 'Asian Handicap', baselineProbability: 0.85 },
    { name: 'AH -2.5 Home', category: 'Asian Handicap', baselineProbability: 0.10 },
    { name: 'AH +2.5 Away', category: 'Asian Handicap', baselineProbability: 0.90 },

    // ==================== ASIAN TOTAL GOALS ====================
    { name: 'Asian Over 0.5', category: 'Asian Total', baselineProbability: 0.96 },
    { name: 'Asian Under 0.5', category: 'Asian Total', baselineProbability: 0.04 },
    { name: 'Asian Over 0.75', category: 'Asian Total', baselineProbability: 0.92 },
    { name: 'Asian Under 0.75', category: 'Asian Total', baselineProbability: 0.08 },
    { name: 'Asian Over 1.0', category: 'Asian Total', baselineProbability: 0.87 },
    { name: 'Asian Under 1.0', category: 'Asian Total', baselineProbability: 0.13 },
    { name: 'Asian Over 1.25', category: 'Asian Total', baselineProbability: 0.82 },
    { name: 'Asian Under 1.25', category: 'Asian Total', baselineProbability: 0.18 },
    { name: 'Asian Over 1.5', category: 'Asian Total', baselineProbability: 0.78 },
    { name: 'Asian Under 1.5', category: 'Asian Total', baselineProbability: 0.22 },
    { name: 'Asian Over 1.75', category: 'Asian Total', baselineProbability: 0.70 },
    { name: 'Asian Under 1.75', category: 'Asian Total', baselineProbability: 0.30 },
    { name: 'Asian Over 2.0', category: 'Asian Total', baselineProbability: 0.63 },
    { name: 'Asian Under 2.0', category: 'Asian Total', baselineProbability: 0.37 },
    { name: 'Asian Over 2.25', category: 'Asian Total', baselineProbability: 0.58 },
    { name: 'Asian Under 2.25', category: 'Asian Total', baselineProbability: 0.42 },
    { name: 'Asian Over 2.5', category: 'Asian Total', baselineProbability: 0.55 },
    { name: 'Asian Under 2.5', category: 'Asian Total', baselineProbability: 0.45 },
    { name: 'Asian Over 2.75', category: 'Asian Total', baselineProbability: 0.48 },
    { name: 'Asian Under 2.75', category: 'Asian Total', baselineProbability: 0.52 },
    { name: 'Asian Over 3.0', category: 'Asian Total', baselineProbability: 0.42 },
    { name: 'Asian Under 3.0', category: 'Asian Total', baselineProbability: 0.58 },
    { name: 'Asian Over 3.25', category: 'Asian Total', baselineProbability: 0.38 },
    { name: 'Asian Under 3.25', category: 'Asian Total', baselineProbability: 0.62 },
    { name: 'Asian Over 3.5', category: 'Asian Total', baselineProbability: 0.35 },
    { name: 'Asian Under 3.5', category: 'Asian Total', baselineProbability: 0.65 },

    // ==================== FIRST HALF ====================
    { name: '1H Over 0.5 Goals', category: 'First Half', baselineProbability: 0.82 },
    { name: '1H Over 1.5 Goals', category: 'First Half', baselineProbability: 0.42 },
    { name: '1H Over 2.5 Goals', category: 'First Half', baselineProbability: 0.15 },
    { name: '1H Under 0.5 Goals', category: 'First Half', baselineProbability: 0.18 },
    { name: '1H Under 1.5 Goals', category: 'First Half', baselineProbability: 0.58 },
    { name: '1H Under 2.5 Goals', category: 'First Half', baselineProbability: 0.85 },
    { name: '1H BTTS Yes', category: 'First Half', baselineProbability: 0.28 },
    { name: '1H BTTS No', category: 'First Half', baselineProbability: 0.72 },
    { name: '1H Home Win', category: 'First Half', baselineProbability: 0.35 },
    { name: '1H Draw', category: 'First Half', baselineProbability: 0.40 },
    { name: '1H Away Win', category: 'First Half', baselineProbability: 0.25 },
    { name: '1H Home or Draw', category: 'First Half', baselineProbability: 0.75 },
    { name: '1H Away or Draw', category: 'First Half', baselineProbability: 0.65 },

    // ==================== SECOND HALF ====================
    { name: '2H Over 0.5 Goals', category: 'Second Half', baselineProbability: 0.85 },
    { name: '2H Over 1.5 Goals', category: 'Second Half', baselineProbability: 0.48 },
    { name: '2H Over 2.5 Goals', category: 'Second Half', baselineProbability: 0.20 },
    { name: '2H Under 0.5 Goals', category: 'Second Half', baselineProbability: 0.15 },
    { name: '2H Under 1.5 Goals', category: 'Second Half', baselineProbability: 0.52 },
    { name: '2H BTTS Yes', category: 'Second Half', baselineProbability: 0.32 },
    { name: '2H BTTS No', category: 'Second Half', baselineProbability: 0.68 },

    // ==================== TEAM GOALS - HOME ====================
    { name: 'Home Over 0.5 Goals', category: 'Home Team Goals', baselineProbability: 0.78 },
    { name: 'Home Over 1.5 Goals', category: 'Home Team Goals', baselineProbability: 0.48 },
    { name: 'Home Over 2.5 Goals', category: 'Home Team Goals', baselineProbability: 0.22 },
    { name: 'Home Over 3.5 Goals', category: 'Home Team Goals', baselineProbability: 0.08 },
    { name: 'Home Under 0.5 Goals', category: 'Home Team Goals', baselineProbability: 0.22 },
    { name: 'Home Under 1.5 Goals', category: 'Home Team Goals', baselineProbability: 0.52 },
    { name: 'Home Under 2.5 Goals', category: 'Home Team Goals', baselineProbability: 0.78 },
    { name: 'Home Clean Sheet Yes', category: 'Home Team Goals', baselineProbability: 0.35 },
    { name: 'Home Fail To Score', category: 'Home Team Goals', baselineProbability: 0.22 },

    // ==================== TEAM GOALS - AWAY ====================
    { name: 'Away Over 0.5 Goals', category: 'Away Team Goals', baselineProbability: 0.65 },
    { name: 'Away Over 1.5 Goals', category: 'Away Team Goals', baselineProbability: 0.35 },
    { name: 'Away Over 2.5 Goals', category: 'Away Team Goals', baselineProbability: 0.15 },
    { name: 'Away Over 3.5 Goals', category: 'Away Team Goals', baselineProbability: 0.05 },
    { name: 'Away Under 0.5 Goals', category: 'Away Team Goals', baselineProbability: 0.35 },
    { name: 'Away Under 1.5 Goals', category: 'Away Team Goals', baselineProbability: 0.65 },
    { name: 'Away Under 2.5 Goals', category: 'Away Team Goals', baselineProbability: 0.85 },
    { name: 'Away Clean Sheet Yes', category: 'Away Team Goals', baselineProbability: 0.25 },
    { name: 'Away Fail To Score', category: 'Away Team Goals', baselineProbability: 0.35 },

    // ==================== CORNERS ====================
    { name: 'Over 6.5 Corners', category: 'Corners', baselineProbability: 0.85 },
    { name: 'Over 7.5 Corners', category: 'Corners', baselineProbability: 0.75 },
    { name: 'Over 8.5 Corners', category: 'Corners', baselineProbability: 0.62 },
    { name: 'Over 9.5 Corners', category: 'Corners', baselineProbability: 0.50 },
    { name: 'Over 10.5 Corners', category: 'Corners', baselineProbability: 0.40 },
    { name: 'Over 11.5 Corners', category: 'Corners', baselineProbability: 0.30 },
    { name: 'Over 12.5 Corners', category: 'Corners', baselineProbability: 0.22 },
    { name: 'Over 13.5 Corners', category: 'Corners', baselineProbability: 0.15 },
    { name: 'Under 8.5 Corners', category: 'Corners', baselineProbability: 0.38 },
    { name: 'Under 9.5 Corners', category: 'Corners', baselineProbability: 0.50 },
    { name: 'Under 10.5 Corners', category: 'Corners', baselineProbability: 0.60 },
    { name: 'Under 11.5 Corners', category: 'Corners', baselineProbability: 0.70 },

    // ==================== CARDS ====================
    { name: 'Over 0.5 Cards', category: 'Cards', baselineProbability: 0.95 },
    { name: 'Over 1.5 Cards', category: 'Cards', baselineProbability: 0.88 },
    { name: 'Over 2.5 Cards', category: 'Cards', baselineProbability: 0.78 },
    { name: 'Over 3.5 Cards', category: 'Cards', baselineProbability: 0.65 },
    { name: 'Over 4.5 Cards', category: 'Cards', baselineProbability: 0.52 },
    { name: 'Over 5.5 Cards', category: 'Cards', baselineProbability: 0.38 },
    { name: 'Over 6.5 Cards', category: 'Cards', baselineProbability: 0.25 },
    { name: 'Under 2.5 Cards', category: 'Cards', baselineProbability: 0.22 },
    { name: 'Under 3.5 Cards', category: 'Cards', baselineProbability: 0.35 },
    { name: 'Under 4.5 Cards', category: 'Cards', baselineProbability: 0.48 },
    { name: 'Under 5.5 Cards', category: 'Cards', baselineProbability: 0.62 },
    { name: 'Red Card Yes', category: 'Cards', baselineProbability: 0.12 },
    { name: 'Red Card No', category: 'Cards', baselineProbability: 0.88 },

    // ==================== CORRECT SCORE ====================
    { name: 'Correct Score 1-0', category: 'Correct Score', baselineProbability: 0.10 },
    { name: 'Correct Score 2-0', category: 'Correct Score', baselineProbability: 0.06 },
    { name: 'Correct Score 2-1', category: 'Correct Score', baselineProbability: 0.08 },
    { name: 'Correct Score 1-1', category: 'Correct Score', baselineProbability: 0.11 },
    { name: 'Correct Score 0-0', category: 'Correct Score', baselineProbability: 0.07 },
    { name: 'Correct Score 0-1', category: 'Correct Score', baselineProbability: 0.08 },
    { name: 'Correct Score 0-2', category: 'Correct Score', baselineProbability: 0.04 },
    { name: 'Correct Score 1-2', category: 'Correct Score', baselineProbability: 0.06 },
    { name: 'Correct Score 3-0', category: 'Correct Score', baselineProbability: 0.03 },
    { name: 'Correct Score 3-1', category: 'Correct Score', baselineProbability: 0.04 },
    { name: 'Correct Score 2-2', category: 'Correct Score', baselineProbability: 0.04 },

    // ==================== WIN MARGINS ====================
    { name: 'Home Win by 1', category: 'Win Margin', baselineProbability: 0.18 },
    { name: 'Home Win by 2', category: 'Win Margin', baselineProbability: 0.12 },
    { name: 'Home Win by 3+', category: 'Win Margin', baselineProbability: 0.08 },
    { name: 'Away Win by 1', category: 'Win Margin', baselineProbability: 0.14 },
    { name: 'Away Win by 2', category: 'Win Margin', baselineProbability: 0.08 },
    { name: 'Away Win by 3+', category: 'Win Margin', baselineProbability: 0.04 },

    // ==================== SPECIAL ====================
    { name: 'Home Win To Nil', category: 'Special', baselineProbability: 0.22 },
    { name: 'Away Win To Nil', category: 'Special', baselineProbability: 0.15 },
    { name: 'Home Win & Over 2.5', category: 'Special', baselineProbability: 0.28 },
    { name: 'Away Win & Over 2.5', category: 'Special', baselineProbability: 0.18 },
    { name: 'Draw & Over 2.5', category: 'Special', baselineProbability: 0.08 },
    { name: 'Draw & Under 2.5', category: 'Special', baselineProbability: 0.18 },
    { name: 'Home Win & BTTS Yes', category: 'Special', baselineProbability: 0.22 },
    { name: 'Away Win & BTTS Yes', category: 'Special', baselineProbability: 0.15 },
    { name: 'Highest Scoring Half - 1st', category: 'Special', baselineProbability: 0.35 },
    { name: 'Highest Scoring Half - 2nd', category: 'Special', baselineProbability: 0.45 },
    { name: 'Highest Scoring Half - Equal', category: 'Special', baselineProbability: 0.20 },
    { name: 'Goal In Both Halves Yes', category: 'Special', baselineProbability: 0.55 },
    { name: 'Goal In Both Halves No', category: 'Special', baselineProbability: 0.45 },
  ];

  // Delete existing markets
  await prisma.marketType.deleteMany({});

  // Insert new markets
  for (const market of markets) {
    await prisma.marketType.create({ data: market });
  }

  console.log(`✅ Created ${markets.length} market types`);
}

seedExpandedMarkets()
  .catch(console.error)
  .finally(() => prisma.$disconnect());