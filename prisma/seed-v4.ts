import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding extended goal markets (up to 6.5)...');

  const newMarkets = [
    // ==================== 11. FIRST HALF GOALS - Extended ====================
    { name: '1H Over 4.5 Goals', category: '11. First Half Goals', baselineProbability: 0.02, typicalOddsLow: 21.00, typicalOddsHigh: 34.00 },
    { name: '1H Under 4.5 Goals', category: '11. First Half Goals', baselineProbability: 0.98, typicalOddsLow: 1.01, typicalOddsHigh: 1.03 },
    { name: '1H Over 5.5 Goals', category: '11. First Half Goals', baselineProbability: 0.01, typicalOddsLow: 51.00, typicalOddsHigh: 81.00 },
    { name: '1H Under 5.5 Goals', category: '11. First Half Goals', baselineProbability: 0.99, typicalOddsLow: 1.00, typicalOddsHigh: 1.01 },
    { name: '1H Over 6.5 Goals', category: '11. First Half Goals', baselineProbability: 0.003, typicalOddsLow: 101.00, typicalOddsHigh: 201.00 },
    { name: '1H Under 6.5 Goals', category: '11. First Half Goals', baselineProbability: 0.997, typicalOddsLow: 1.00, typicalOddsHigh: 1.00 },

    // ==================== 12. SECOND HALF GOALS - Extended ====================
    { name: '2H Over 4.5 Goals', category: '12. Second Half Goals', baselineProbability: 0.03, typicalOddsLow: 17.00, typicalOddsHigh: 29.00 },
    { name: '2H Under 4.5 Goals', category: '12. Second Half Goals', baselineProbability: 0.97, typicalOddsLow: 1.01, typicalOddsHigh: 1.04 },
    { name: '2H Over 5.5 Goals', category: '12. Second Half Goals', baselineProbability: 0.01, typicalOddsLow: 41.00, typicalOddsHigh: 67.00 },
    { name: '2H Under 5.5 Goals', category: '12. Second Half Goals', baselineProbability: 0.99, typicalOddsLow: 1.00, typicalOddsHigh: 1.01 },
    { name: '2H Over 6.5 Goals', category: '12. Second Half Goals', baselineProbability: 0.004, typicalOddsLow: 81.00, typicalOddsHigh: 151.00 },
    { name: '2H Under 6.5 Goals', category: '12. Second Half Goals', baselineProbability: 0.996, typicalOddsLow: 1.00, typicalOddsHigh: 1.00 },

    // ==================== 13. HOME TEAM GOALS - Extended ====================
    { name: 'Home Over 4.5 Goals', category: '13. Home Team Goals', baselineProbability: 0.04, typicalOddsLow: 15.00, typicalOddsHigh: 26.00 },
    { name: 'Home Under 4.5 Goals', category: '13. Home Team Goals', baselineProbability: 0.96, typicalOddsLow: 1.01, typicalOddsHigh: 1.05 },
    { name: 'Home Over 5.5 Goals', category: '13. Home Team Goals', baselineProbability: 0.01, typicalOddsLow: 41.00, typicalOddsHigh: 67.00 },
    { name: 'Home Under 5.5 Goals', category: '13. Home Team Goals', baselineProbability: 0.99, typicalOddsLow: 1.00, typicalOddsHigh: 1.01 },
    { name: 'Home Over 6.5 Goals', category: '13. Home Team Goals', baselineProbability: 0.003, typicalOddsLow: 101.00, typicalOddsHigh: 201.00 },
    { name: 'Home Under 6.5 Goals', category: '13. Home Team Goals', baselineProbability: 0.997, typicalOddsLow: 1.00, typicalOddsHigh: 1.00 },

    // ==================== 14. AWAY TEAM GOALS - Extended ====================
    { name: 'Away Over 4.5 Goals', category: '14. Away Team Goals', baselineProbability: 0.02, typicalOddsLow: 26.00, typicalOddsHigh: 41.00 },
    { name: 'Away Under 4.5 Goals', category: '14. Away Team Goals', baselineProbability: 0.98, typicalOddsLow: 1.01, typicalOddsHigh: 1.03 },
    { name: 'Away Over 5.5 Goals', category: '14. Away Team Goals', baselineProbability: 0.006, typicalOddsLow: 67.00, typicalOddsHigh: 101.00 },
    { name: 'Away Under 5.5 Goals', category: '14. Away Team Goals', baselineProbability: 0.994, typicalOddsLow: 1.00, typicalOddsHigh: 1.01 },
    { name: 'Away Over 6.5 Goals', category: '14. Away Team Goals', baselineProbability: 0.002, typicalOddsLow: 151.00, typicalOddsHigh: 251.00 },
    { name: 'Away Under 6.5 Goals', category: '14. Away Team Goals', baselineProbability: 0.998, typicalOddsLow: 1.00, typicalOddsHigh: 1.00 },

    // ==================== 6. BTTS & GOALS - Extended ====================
    { name: 'BTTS Yes & Over 6.5 Goals', category: '6. BTTS & Goals', baselineProbability: 0.05, typicalOddsLow: 13.00, typicalOddsHigh: 21.00 },
    { name: 'BTTS Yes & Under 6.5 Goals', category: '6. BTTS & Goals', baselineProbability: 0.47, typicalOddsLow: 1.80, typicalOddsHigh: 2.30 },
    { name: 'BTTS No & Over 6.5 Goals', category: '6. BTTS & Goals', baselineProbability: 0.02, typicalOddsLow: 26.00, typicalOddsHigh: 41.00 },
    { name: 'BTTS No & Under 6.5 Goals', category: '6. BTTS & Goals', baselineProbability: 0.46, typicalOddsLow: 1.85, typicalOddsHigh: 2.35 },

    // ==================== 7. RESULT & GOALS - Extended (5.5 & 6.5) ====================
    { name: 'Home Win & Over 5.5 Goals', category: '7. Result & Goals', baselineProbability: 0.08, typicalOddsLow: 9.00, typicalOddsHigh: 14.00 },
    { name: 'Home Win & Under 5.5 Goals', category: '7. Result & Goals', baselineProbability: 0.37, typicalOddsLow: 2.20, typicalOddsHigh: 3.00 },
    { name: 'Away Win & Over 5.5 Goals', category: '7. Result & Goals', baselineProbability: 0.05, typicalOddsLow: 13.00, typicalOddsHigh: 21.00 },
    { name: 'Away Win & Under 5.5 Goals', category: '7. Result & Goals', baselineProbability: 0.24, typicalOddsLow: 3.30, typicalOddsHigh: 4.80 },
    { name: 'Draw & Over 5.5 Goals', category: '7. Result & Goals', baselineProbability: 0.02, typicalOddsLow: 26.00, typicalOddsHigh: 41.00 },
    { name: 'Draw & Under 5.5 Goals', category: '7. Result & Goals', baselineProbability: 0.24, typicalOddsLow: 3.30, typicalOddsHigh: 4.80 },
    { name: 'Home Win & Over 6.5 Goals', category: '7. Result & Goals', baselineProbability: 0.04, typicalOddsLow: 17.00, typicalOddsHigh: 26.00 },
    { name: 'Home Win & Under 6.5 Goals', category: '7. Result & Goals', baselineProbability: 0.41, typicalOddsLow: 2.00, typicalOddsHigh: 2.70 },
    { name: 'Away Win & Over 6.5 Goals', category: '7. Result & Goals', baselineProbability: 0.02, typicalOddsLow: 26.00, typicalOddsHigh: 41.00 },
    { name: 'Away Win & Under 6.5 Goals', category: '7. Result & Goals', baselineProbability: 0.27, typicalOddsLow: 2.80, typicalOddsHigh: 4.00 },
    { name: 'Draw & Over 6.5 Goals', category: '7. Result & Goals', baselineProbability: 0.01, typicalOddsLow: 51.00, typicalOddsHigh: 81.00 },
    { name: 'Draw & Under 6.5 Goals', category: '7. Result & Goals', baselineProbability: 0.25, typicalOddsLow: 3.00, typicalOddsHigh: 4.50 },

    // ==================== 9. DOUBLE CHANCE & GOALS - Extended ====================
    { name: '1X & Over 5.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.12, typicalOddsLow: 6.00, typicalOddsHigh: 10.00 },
    { name: 'X2 & Over 5.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.08, typicalOddsLow: 9.00, typicalOddsHigh: 14.00 },
    { name: '12 & Over 5.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.14, typicalOddsLow: 5.00, typicalOddsHigh: 8.00 },
    { name: '1X & Over 6.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.06, typicalOddsLow: 11.00, typicalOddsHigh: 17.00 },
    { name: 'X2 & Over 6.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.04, typicalOddsLow: 17.00, typicalOddsHigh: 26.00 },
    { name: '12 & Over 6.5 Goals', category: '9. Double Chance & Goals', baselineProbability: 0.07, typicalOddsLow: 10.00, typicalOddsHigh: 15.00 },

    // ==================== 1. TOTAL GOALS - Asian Lines ====================
    { name: 'Over 0.75 Goals', category: '1. Total Goals', baselineProbability: 0.94, typicalOddsLow: 1.03, typicalOddsHigh: 1.10 },
    { name: 'Under 0.75 Goals', category: '1. Total Goals', baselineProbability: 0.06, typicalOddsLow: 8.00, typicalOddsHigh: 15.00 },
    { name: 'Over 1.25 Goals', category: '1. Total Goals', baselineProbability: 0.82, typicalOddsLow: 1.12, typicalOddsHigh: 1.30 },
    { name: 'Under 1.25 Goals', category: '1. Total Goals', baselineProbability: 0.18, typicalOddsLow: 3.50, typicalOddsHigh: 6.00 },
    { name: 'Over 1.75 Goals', category: '1. Total Goals', baselineProbability: 0.78, typicalOddsLow: 1.18, typicalOddsHigh: 1.40 },
    { name: 'Under 1.75 Goals', category: '1. Total Goals', baselineProbability: 0.22, typicalOddsLow: 3.00, typicalOddsHigh: 5.00 },
    { name: 'Over 2.25 Goals', category: '1. Total Goals', baselineProbability: 0.65, typicalOddsLow: 1.40, typicalOddsHigh: 1.70 },
    { name: 'Under 2.25 Goals', category: '1. Total Goals', baselineProbability: 0.35, typicalOddsLow: 2.10, typicalOddsHigh: 2.80 },
    { name: 'Over 2.75 Goals', category: '1. Total Goals', baselineProbability: 0.58, typicalOddsLow: 1.55, typicalOddsHigh: 1.90 },
    { name: 'Under 2.75 Goals', category: '1. Total Goals', baselineProbability: 0.42, typicalOddsLow: 1.90, typicalOddsHigh: 2.40 },
    { name: 'Over 3.25 Goals', category: '1. Total Goals', baselineProbability: 0.40, typicalOddsLow: 2.10, typicalOddsHigh: 2.70 },
    { name: 'Under 3.25 Goals', category: '1. Total Goals', baselineProbability: 0.60, typicalOddsLow: 1.45, typicalOddsHigh: 1.75 },
    { name: 'Over 3.75 Goals', category: '1. Total Goals', baselineProbability: 0.35, typicalOddsLow: 2.30, typicalOddsHigh: 3.10 },
    { name: 'Under 3.75 Goals', category: '1. Total Goals', baselineProbability: 0.65, typicalOddsLow: 1.35, typicalOddsHigh: 1.60 },
    { name: 'Over 4.25 Goals', category: '1. Total Goals', baselineProbability: 0.22, typicalOddsLow: 3.20, typicalOddsHigh: 4.50 },
    { name: 'Under 4.25 Goals', category: '1. Total Goals', baselineProbability: 0.78, typicalOddsLow: 1.18, typicalOddsHigh: 1.38 },
    { name: 'Over 4.75 Goals', category: '1. Total Goals', baselineProbability: 0.18, typicalOddsLow: 4.00, typicalOddsHigh: 5.80 },
    { name: 'Under 4.75 Goals', category: '1. Total Goals', baselineProbability: 0.82, typicalOddsLow: 1.12, typicalOddsHigh: 1.28 },
    { name: 'Over 5.25 Goals', category: '1. Total Goals', baselineProbability: 0.12, typicalOddsLow: 5.50, typicalOddsHigh: 8.50 },
    { name: 'Under 5.25 Goals', category: '1. Total Goals', baselineProbability: 0.88, typicalOddsLow: 1.06, typicalOddsHigh: 1.18 },
    { name: 'Over 5.75 Goals', category: '1. Total Goals', baselineProbability: 0.10, typicalOddsLow: 7.00, typicalOddsHigh: 11.00 },
    { name: 'Under 5.75 Goals', category: '1. Total Goals', baselineProbability: 0.90, typicalOddsLow: 1.04, typicalOddsHigh: 1.12 },
    { name: 'Over 6.25 Goals', category: '1. Total Goals', baselineProbability: 0.05, typicalOddsLow: 13.00, typicalOddsHigh: 21.00 },
    { name: 'Under 6.25 Goals', category: '1. Total Goals', baselineProbability: 0.95, typicalOddsLow: 1.02, typicalOddsHigh: 1.06 },
    { name: 'Over 6.75 Goals', category: '1. Total Goals', baselineProbability: 0.04, typicalOddsLow: 17.00, typicalOddsHigh: 29.00 },
    { name: 'Under 6.75 Goals', category: '1. Total Goals', baselineProbability: 0.96, typicalOddsLow: 1.01, typicalOddsHigh: 1.04 },
  ];

  let added = 0;
  let skipped = 0;

  for (const market of newMarkets) {
    try {
      // Check if market already exists
      const existing = await prisma.marketType.findFirst({
        where: { name: market.name, category: market.category }
      });

      if (existing) {
        console.log(`  ⏭️  Skipping ${market.name} - already exists`);
        skipped++;
        continue;
      }

      await prisma.marketType.create({ data: market });
      console.log(`  ✅ Added ${market.name}`);
      added++;
    } catch (error) {
      console.log(`  ⚠️  Error adding ${market.name}: ${error}`);
    }
  }

  console.log(`\n🎉 Done! Added ${added} new markets, skipped ${skipped} existing.`);
  
  // Show totals
  const totalMarkets = await prisma.marketType.count();
  console.log(`📊 Total markets in database: ${totalMarkets}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });