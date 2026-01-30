import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding additional leagues...');

  const newLeagues = [
    // ==================== ENGLAND - Additional Cups ====================
    { name: 'EFL Trophy', country: 'England', apiFootballId: 46, over15GoalsRate: 0.83, over25GoalsRate: 0.65, avgGoalsPerMatch: 2.55 },

    // ==================== FRANCE - Cups ====================
    { name: 'Coupe de la Ligue', country: 'France', apiFootballId: 65, over15GoalsRate: 0.83, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.62 },

    // ==================== TURKEY - Cup ====================
    { name: 'Turkish Cup', country: 'Turkey', apiFootballId: 206, over15GoalsRate: 0.84, over25GoalsRate: 0.66, avgGoalsPerMatch: 2.60 },
    { name: 'Super Cup', country: 'Turkey', apiFootballId: 207, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.70 },

    // ==================== SCOTLAND - Cups ====================
    { name: 'League Cup', country: 'Scotland', apiFootballId: 181, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.72 },

    // ==================== GREECE - Cup ====================
    { name: 'Greek Cup', country: 'Greece', apiFootballId: 198, over15GoalsRate: 0.82, over25GoalsRate: 0.63, avgGoalsPerMatch: 2.48 },

    // ==================== BELGIUM - Cup ====================
    { name: 'Belgian Cup', country: 'Belgium', apiFootballId: 147, over15GoalsRate: 0.86, over25GoalsRate: 0.69, avgGoalsPerMatch: 2.78 },

    // ==================== DENMARK - Cup ====================
    { name: 'Danish Cup', country: 'Denmark', apiFootballId: 121, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.82 },

    // ==================== SAUDI ARABIA - Cup ====================
    { name: 'Kings Cup', country: 'Saudi Arabia', apiFootballId: 308, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.70 },
    { name: 'Super Cup', country: 'Saudi Arabia', apiFootballId: 309, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.80 },

    // ==================== SWEDEN - Cup ====================
    { name: 'Svenska Cupen', country: 'Sweden', apiFootballId: 115, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.72 },

    // ==================== SPAIN - Super Cup ====================
    { name: 'Supercopa', country: 'Spain', apiFootballId: 142, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.80 },

    // ==================== ITALY - Super Cup ====================
    { name: 'Supercoppa', country: 'Italy', apiFootballId: 138, over15GoalsRate: 0.85, over25GoalsRate: 0.69, avgGoalsPerMatch: 2.75 },

    // ==================== GERMANY - Super Cup ====================
    { name: 'DFL-Supercup', country: 'Germany', apiFootballId: 82, over15GoalsRate: 0.88, over25GoalsRate: 0.74, avgGoalsPerMatch: 3.00 },

    // ==================== ENGLAND - Community Shield ====================
    { name: 'Community Shield', country: 'England', apiFootballId: 528, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.70 },

    // ==================== WOMEN'S FOOTBALL ====================
    { name: 'WSL', country: 'England Women', apiFootballId: 712, over15GoalsRate: 0.88, over25GoalsRate: 0.74, avgGoalsPerMatch: 3.05 },
    { name: 'Championship', country: 'England Women', apiFootballId: 713, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.85 },
    { name: 'FA Womens Cup', country: 'England Women', apiFootballId: 714, over15GoalsRate: 0.87, over25GoalsRate: 0.72, avgGoalsPerMatch: 2.92 },
    { name: 'League Cup', country: 'England Women', apiFootballId: 715, over15GoalsRate: 0.86, over25GoalsRate: 0.70, avgGoalsPerMatch: 2.85 },
    { name: 'UEFA Womens Champions League', country: 'Europe Women', apiFootballId: 750, over15GoalsRate: 0.89, over25GoalsRate: 0.76, avgGoalsPerMatch: 3.15 },
    { name: 'Womens World Cup', country: 'International Women', apiFootballId: 751, over15GoalsRate: 0.87, over25GoalsRate: 0.73, avgGoalsPerMatch: 2.95 },
    { name: 'Womens Euro', country: 'International Women', apiFootballId: 752, over15GoalsRate: 0.86, over25GoalsRate: 0.71, avgGoalsPerMatch: 2.88 },

    // ==================== PORTUGAL - Cups ====================
    { name: 'Taça da Liga', country: 'Portugal', apiFootballId: 97, over15GoalsRate: 0.83, over25GoalsRate: 0.65, avgGoalsPerMatch: 2.55 },
    { name: 'Supertaça', country: 'Portugal', apiFootballId: 98, over15GoalsRate: 0.85, over25GoalsRate: 0.68, avgGoalsPerMatch: 2.70 },

    // ==================== NETHERLANDS - Super Cup ====================
    { name: 'Johan Cruijff Schaal', country: 'Netherlands', apiFootballId: 91, over15GoalsRate: 0.90, over25GoalsRate: 0.78, avgGoalsPerMatch: 3.20 },
  ];

  let added = 0;
  let skipped = 0;

  for (const league of newLeagues) {
    try {
      // Check if league already exists (by apiFootballId or name+country)
      const existing = await prisma.league.findFirst({
        where: {
          OR: [
            { apiFootballId: league.apiFootballId },
            { name: league.name, country: league.country }
          ]
        }
      });

      if (existing) {
        console.log(`  ⏭️  Skipping ${league.name} (${league.country}) - already exists`);
        skipped++;
        continue;
      }

      await prisma.league.create({ data: league });
      console.log(`  ✅ Added ${league.name} (${league.country})`);
      added++;
    } catch (error) {
      console.log(`  ⚠️  Error adding ${league.name}: ${error}`);
    }
  }

  console.log(`\n🎉 Done! Added ${added} new leagues, skipped ${skipped} existing.`);
  
  // Show totals
  const totalLeagues = await prisma.league.count();
  console.log(`📊 Total leagues in database: ${totalLeagues}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });