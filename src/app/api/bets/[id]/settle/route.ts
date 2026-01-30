import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { result, selectionResults } = body;

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

        // Update market stats using market NAME
        if (selection && selection.market) {
          const marketType = await prisma.marketType.findUnique({
            where: { name: selection.market },
          });

          if (marketType) {
            const newTotal = marketType.totalSelections + 1;
            const newWon = selResult === 'won' ? marketType.wonSelections + 1 : marketType.wonSelections;
            
            await prisma.marketType.update({
              where: { name: selection.market },
              data: {
                totalSelections: newTotal,
                wonSelections: newWon,
                actualHitRate: newWon / newTotal,
              },
            });
          }
        }

        // Update league stats
        if (selection && selection.leagueId) {
          const league = await prisma.league.findUnique({
            where: { id: selection.leagueId },
          });

          if (league) {
            const newTotal = league.totalSelections + 1;
            const newWon = selResult === 'won' ? league.wonSelections + 1 : league.wonSelections;
            
            await prisma.league.update({
              where: { id: selection.leagueId },
              data: {
                totalSelections: newTotal,
                wonSelections: newWon,
                actualHitRate: newWon / newTotal,
              },
            });
          }
        }
      }
    }

    // Determine overall bet result
    const allSelectionsWon = bet.selections.length > 0 && 
      Object.values(selectionResults || {}).every(r => r === 'won');
    const betResult = result || (allSelectionsWon ? 'won' : 'lost');

    // Calculate returns
    const returns = betResult === 'won' ? bet.stake * bet.totalOdds : 0;

    // Update bet (only use fields that exist in schema)
    const updatedBet = await prisma.bet.update({
      where: { id: params.id },
      data: {
        status: betResult,
        returns: returns,
        settledAt: new Date(),
      },
      include: {
        selections: true,
        stream: true,
      },
    });

    // Update stream
    if (bet.stream) {
      const profitLoss = betResult === 'won' ? returns - bet.stake : -bet.stake;
      
      const streamUpdateData: {
        currentDay: number;
        wonBets: number;
        lostBets: number;
        currentBalance?: number;
        status?: string;
        actualWinRate: number;
      } = {
        currentDay: bet.stream.currentDay + 1,
        wonBets: betResult === 'won' ? bet.stream.wonBets + 1 : bet.stream.wonBets,
        lostBets: betResult === 'lost' ? bet.stream.lostBets + 1 : bet.stream.lostBets,
        actualWinRate: 0,
      };

      if (betResult === 'won') {
        streamUpdateData.currentBalance = returns;
        streamUpdateData.actualWinRate = (bet.stream.wonBets + 1) / (bet.stream.wonBets + bet.stream.lostBets + 1);
      } else {
        streamUpdateData.currentBalance = 0;
        streamUpdateData.status = 'failed';
        streamUpdateData.actualWinRate = bet.stream.wonBets / (bet.stream.wonBets + bet.stream.lostBets + 1);
      }

      await prisma.stream.update({
        where: { id: bet.streamId },
        data: streamUpdateData,
      });

      // Update bankroll
      const bankroll = await prisma.bankroll.findFirst();
      if (bankroll) {
        await prisma.bankroll.update({
          where: { id: bankroll.id },
          data: {
            lifetimeProfitLoss: bankroll.lifetimeProfitLoss + profitLoss,
          },
        });
      }
    }

    return NextResponse.json(updatedBet);
  } catch (error) {
    console.error('Failed to settle bet:', error);
    return NextResponse.json(
      { error: 'Failed to settle bet' },
      { status: 500 }
    );
  }
}