import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { result, selectionResults } = await request.json();

    const bet = await prisma.bet.findUnique({
      where: { id: params.id },
      include: {
        selections: true,
        stream: true,
      },
    });

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    if (bet.status !== 'pending') {
      return NextResponse.json({ error: 'Bet already settled' }, { status: 400 });
    }

    // Update each selection's result
    if (selectionResults && typeof selectionResults === 'object') {
      for (const [selectionId, selResult] of Object.entries(selectionResults)) {
        const selection = bet.selections.find(s => s.id === selectionId);
        
        await prisma.selection.update({
          where: { id: selectionId },
          data: {
            status: selResult as string,
            result: selResult as string,
            settledAt: new Date(),
          },
        });

        // Update market stats by market name (not marketId)
        if (selection?.market) {
          const market = await prisma.marketType.findUnique({
            where: { name: selection.market },
          });

          if (market) {
            await prisma.marketType.update({
              where: { name: selection.market },
              data: {
                totalSelections: market.totalSelections + 1,
                wonSelections: selResult === 'won' ? market.wonSelections + 1 : market.wonSelections,
                actualHitRate: (market.wonSelections + (selResult === 'won' ? 1 : 0)) / (market.totalSelections + 1),
              },
            });
          }
        }

        // Update league stats
        if (selection?.leagueId) {
          const league = await prisma.league.findUnique({
            where: { id: selection.leagueId },
          });

          if (league) {
            await prisma.league.update({
              where: { id: selection.leagueId },
              data: {
                totalSelections: league.totalSelections + 1,
                wonSelections: selResult === 'won' ? league.wonSelections + 1 : league.wonSelections,
                actualHitRate: (league.wonSelections + (selResult === 'won' ? 1 : 0)) / (league.totalSelections + 1),
              },
            });
          }
        }
      }
    }

    // Determine overall bet result
    const allWon = bet.selections.length > 0 && 
      Object.values(selectionResults || {}).every(r => r === 'won');
    const betResult = result || (allWon ? 'won' : 'lost');

    // Calculate returns
    const returns = betResult === 'won' ? bet.stake * bet.totalOdds : 0;
    const profitLoss = betResult === 'won' ? returns - bet.stake : -bet.stake;

    // Update bet
    const updatedBet = await prisma.bet.update({
      where: { id: params.id },
      data: {
        status: betResult,
        returns: returns,
        profitLoss: profitLoss,
        settledAt: new Date(),
      },
      include: {
        selections: true,
        stream: true,
      },
    });

    // Update stream
    if (bet.stream) {
      const newBalance = betResult === 'won' 
        ? bet.stream.currentBalance + returns - bet.stake + bet.stake  // stake was already deducted conceptually
        : bet.stream.currentBalance; // Lost - balance already reflects stake

      // Actually for compound betting, stake = current balance
      // If won: new balance = stake * odds = currentBalance * odds
      // If lost: new balance = 0 (stream fails) or we track it differently

      const streamUpdate: any = {
        currentDay: bet.stream.currentDay + 1,
        wonBets: betResult === 'won' ? bet.stream.wonBets + 1 : bet.stream.wonBets,
        lostBets: betResult === 'lost' ? bet.stream.lostBets + 1 : bet.stream.lostBets,
      };

      if (betResult === 'won') {
        streamUpdate.currentBalance = returns;
        streamUpdate.actualWinRate = (bet.stream.wonBets + 1) / (bet.stream.wonBets + bet.stream.lostBets + 1);
      } else {
        // Stream lost - mark as failed
        streamUpdate.currentBalance = 0;
        streamUpdate.status = 'failed';
        streamUpdate.actualWinRate = bet.stream.wonBets / (bet.stream.wonBets + bet.stream.lostBets + 1);
      }

      await prisma.stream.update({
        where: { id: bet.streamId },
        data: streamUpdate,
      });

      // Update bankroll
      const bankroll = await prisma.bankroll.findFirst();
      if (bankroll) {
        await prisma.bankroll.update({
          where: { id: bankroll.id },
          data: {
            lifetimeProfitLoss: bankroll.lifetimeProfitLoss + profitLoss,
            deployedCapital: betResult === 'lost' 
              ? bankroll.deployedCapital - bet.stake 
              : bankroll.deployedCapital + profitLoss,
          },
        });
      }
    }

    return NextResponse.json(updatedBet);
  } catch (error) {
    console.error('Failed to settle bet:', error);
    return NextResponse.json(
      { error: 'Failed to settle bet: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}