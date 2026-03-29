'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';
import { Badge } from '../components/ui/badge';

interface StandingsApiTeam {
  tid: number;
  name: string;
  logo: string;
  position: number;
  wins: number;
  losses: number;
  draws: number;
  playedGames: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface Team {
  tid: number;
  logo: string;
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
}

export function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getStandings = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/sports/standings');
        if (!res.ok) throw new Error('Failed to fetch standings');

        const data = await res.json();

        const mappedTeams: Team[] = data.standings.map((team: StandingsApiTeam) => ({
          tid: team.tid,
          logo: team.logo,
          position: team.position,
          team: team.name,
          played: team.playedGames,
          won: team.wins,
          drawn: team.draws,
          lost: team.losses,
          goalsFor: team.goalsFor,
          goalsAgainst: team.goalsAgainst,
          goalDifference: team.goalsFor - team.goalsAgainst,
          points: team.points,
          form: [],
        }));

        setTeams(mappedTeams);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getStandings();
  }, []);

  const getFormIcon = (result: string) => {
    switch (result) {
      case 'W':
        return <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">W</div>;
      case 'D':
        return <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold">D</div>;
      case 'L':
        return <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">L</div>;
      default:
        return null;
    }
  };
  return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">

    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => router.push('/main')} className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl">Premier League Standings</h1>
              <p className="text-muted-foreground">Complete team statistics and information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading standings...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="hidden md:block">
              <CardHeader className="pb-3">
                <div className="grid grid-cols-10 gap-4 text-sm font-semibold text-muted-foreground">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-3">Team</div>
                  <div className="col-span-1 text-center">P</div>
                  <div className="col-span-1 text-center">W</div>
                  <div className="col-span-1 text-center">D</div>
                  <div className="col-span-1 text-center">L</div>
                  <div className="col-span-1 text-center">GD</div>
                  <div className="col-span-1 text-center">Pts</div>
                </div>
              </CardHeader>
            </Card>

            {teams.map((team) => (
              <Card key={team.tid} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="hidden md:block">
                  <div className="grid grid-cols-10 gap-4 items-center h-16">
                      <div className="col-span-1 text-center">
                      <div className="flex items-center justify-center h-full">
                          <span className="text-xl font-bold">
                            {team.position}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-3 flex items-center gap-3">
                        <img src={team.logo} alt={team.team} className="w-10 h-10 object-contain" />
                        <CardTitle className="text-lg">{team.team}</CardTitle>
                      </div>

                      <div className="col-span-1 text-center font-semibold">{team.played}</div>
                      <div className="col-span-1 text-center font-semibold text-green-600">{team.won}</div>
                      <div className="col-span-1 text-center font-semibold text-gray-500">{team.drawn}</div>
                      <div className="col-span-1 text-center font-semibold text-red-600">{team.lost}</div>
                      <div className="col-span-1 text-center">
                        <span className={`font-semibold ${team.goalDifference > 0 ? 'text-green-600' : team.goalDifference < 0 ? 'text-red-600' : ''}`}>
                          {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                        </span>
                        <p className="text-xs text-muted-foreground">{team.goalsFor}:{team.goalsAgainst}</p>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="text-xl font-bold">{team.points}</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:hidden space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl font-bold`}>
                          {team.position}
                        </span>
                        <img src={team.logo} alt={team.team} className="w-10 h-10 object-contain" />
                        <div>
                          <CardTitle className="text-lg">{team.team}</CardTitle>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span>{team.points} pts</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        {team.played} played
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                      <div>
                        <p className="text-muted-foreground">W-D-L</p>
                        <p className="font-semibold">{team.won}-{team.drawn}-{team.lost}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Goals</p>
                        <p className="font-semibold">{team.goalsFor}-{team.goalsAgainst}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">GD</p>
                        <p className={`font-semibold ${team.goalDifference > 0 ? 'text-green-600' : team.goalDifference < 0 ? 'text-red-600' : ''}`}>
                          {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}