'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Users,
  Filter,
  X,
  MapPin,
  Smile,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';

interface MatchApiItem {
  mid: number;
  date: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  threadId: number | null;
  stage?: string;
  venue?: string | null;
  sent1?: number | null;
  sent2?: number | null;
  homeTeam: {
    name: string;
    logo: string;
  };
  awayTeam: {
    name: string;
    logo: string;
  };
  thread?: {
    _count?: {
      comments: number;
    };
  } | null;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  date: string;
  time: string;
  status: 'upcoming' | 'live' | 'finished';
  venue: string | null;
  sent1: number | null;
  sent2: number | null;
  score?: {
    home: number;
    away: number;
  };
  comments: number;
  threadId: number | null;
}

type Filters = {
  matchday: string;
  stage: string;
  from: string;
  to: string;
};

const DEFAULT_FILTERS: Filters = {
  matchday: '',
  stage: '',
  from: '',
  to: '',
};

export function MatchThreadsPage() {
  const router = useRouter();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);

  const hasActiveFilters = useMemo(() => {
    return Object.values(appliedFilters).some(Boolean);
  }, [appliedFilters]);

  useEffect(() => {
    const getMatches = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();

        if (appliedFilters.matchday) params.set('matchday', appliedFilters.matchday);
        if (appliedFilters.stage) params.set('stage', appliedFilters.stage);
        if (appliedFilters.from) params.set('from', appliedFilters.from);
        if (appliedFilters.to) params.set('to', appliedFilters.to);

        const url = params.toString()
          ? `/api/sports/matches?${params.toString()}`
          : '/api/sports/matches';

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch matches');

        const data = await res.json();

        const mappedMatches: Match[] = data.matches.map((match: MatchApiItem) => {
          let normalizedStatus: 'upcoming' | 'live' | 'finished' = 'upcoming';

          if (match.status === 'FINISHED') normalizedStatus = 'finished';
          else if (
            match.status === 'LIVE' ||
            match.status === 'IN_PLAY' ||
            match.status === 'PAUSED'
          ) {
            normalizedStatus = 'live';
          }

          const matchDate = new Date(match.date);

          return {
            id: String(match.mid),
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
            homeLogo: match.homeTeam.logo,
            awayLogo: match.awayTeam.logo,
            date: match.date,
            time: matchDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            status: normalizedStatus,
            venue: match.venue ?? null,
            sent1: match.sent1 ?? null,
            sent2: match.sent2 ?? null,
            score:
              match.homeScore !== null && match.awayScore !== null
                ? { home: match.homeScore, away: match.awayScore }
                : undefined,
            comments: match.thread?._count?.comments ?? 0,
            threadId: match.threadId,
          };
        });

        setMatches(mappedMatches);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getMatches();
  }, [appliedFilters]);

  const getStatusBadge = (status: Match['status']) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 hover:bg-red-600">LIVE</Badge>;
      case 'finished':
        return <Badge variant="secondary">FT</Badge>;
      case 'upcoming':
        return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  const formatMatchDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatSentiment = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toString();
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">

    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => router.push('/main')} className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl">Matches</h1>
              <p className="text-muted-foreground">Discuss live and upcoming matches</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle className="text-xl">Filter Matches</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Matchday</label>
                <input
                  type="number"
                  min="1"
                  value={filters.matchday}
                  onChange={(e) => updateFilter('matchday', e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Stage</label>
                <select
                  value={filters.stage}
                  onChange={(e) => updateFilter('stage', e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark]"
                >
                  <option value="">All stages</option>
                  <option value="REGULAR_SEASON">REGULAR_SEASON</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => updateFilter('from', e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => updateFilter('to', e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={applyFilters}>Apply Filters</Button>
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              You can now combine filters. For example: <strong>matchday + stage</strong> or{' '}
              <strong>stage + from/to</strong>.
            </p>
          </CardContent>
        </Card>

        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap gap-2">
            {appliedFilters.matchday && (
              <Badge variant="secondary">Matchday: {appliedFilters.matchday}</Badge>
            )}
            {appliedFilters.stage && (
              <Badge variant="secondary">Stage: {appliedFilters.stage}</Badge>
            )}
            {appliedFilters.from && (
              <Badge variant="secondary">From: {appliedFilters.from}</Badge>
            )}
            {appliedFilters.to && <Badge variant="secondary">To: {appliedFilters.to}</Badge>}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No matches found for the selected filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <Card
                key={match.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  console.log("Card clicked:", match);
                  console.log("threadId:", match.threadId);
                  if (match.threadId !== null) {
                    router.push(`/thread/${match.threadId}`);
                  } else {
                    alert("Thread not available for this match yet.");
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 text-foreground" />
                      <span>{formatMatchDate(match.date)}</span>
                      <span>•</span>
                      <span>{match.time}</span>
                    </div>
                    {getStatusBadge(match.status)}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{match.venue || 'Venue unavailable'}</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={match.homeLogo}
                          alt={match.homeTeam}
                          className="w-10 h-10 object-contain"
                        />
                        <div>
                          <CardTitle className="text-lg">{match.homeTeam}</CardTitle>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Smile className="h-4 w-4" />
                            <span>Sentiment: {formatSentiment(match.sent1)}</span>
                          </div>
                        </div>
                      </div>
                      {match.score && (
                        <span className="text-2xl font-bold min-w-[2rem] text-center">
                          {match.score.home}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={match.awayLogo}
                          alt={match.awayTeam}
                          className="w-10 h-10 object-contain"
                        />
                        <div>
                          <CardTitle className="text-lg">{match.awayTeam}</CardTitle>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Smile className="h-4 w-4" />
                            <span>Sentiment: {formatSentiment(match.sent2)}</span>
                          </div>
                        </div>
                      </div>
                      {match.score && (
                        <span className="text-2xl font-bold min-w-[2rem] text-center">
                          {match.score.away}
                        </span>
                      )}
                    </div>

                    <div className="pt-3 border-t flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{match.comments} comments</span>
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