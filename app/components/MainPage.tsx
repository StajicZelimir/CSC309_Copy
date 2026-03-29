"use client";

import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MessageSquare, Trophy, Clock, User, Shield, Search, LogOut, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from './ui/badge';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserSearchDialog } from './UserSearchDialog';
import { ThemeToggle } from './ThemeToggle';

interface Thread {
  id: string;
  title: string;
  author: {
    username: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  // replies: number;
  // category: string;
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
  // form: string[];
}

export function MainPage() {
  console.log("Main Rendering"); // This prints in your terminal
  // const navigate = useNavigate();
  const router = useRouter();
  const [digest, setDigest] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [teamStats, setTeamStats] = useState<Team>();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const init = async () => {
      console.log(localStorage.getItem("currentUser"))
      if (localStorage.getItem("currentUser") === null) {
        const username = searchParams.get("username");
        if (!username) return;
  
        const loadUser = async () => {
          try {
            const res = await fetch(`/api/user/${encodeURIComponent(username)}`, {
              method: "GET",
              credentials: "include",
            });
  
            if (!res.ok) {
              console.log("Failed to fetch user");
              return;
            }
  
            const response = await res.json();
  
            localStorage.setItem(
              "currentUser",
              JSON.stringify({
                uid: response.uid,
                username: response.username,
                email: response.email,
                isGuest: false,
                isAdmin: response.role === "admin",
                isBanned: response.isBan,
                avatar: response.avatar,
                favoriteTeam: response.favId,
                createdAt: response.createdAt,
              })
            );
          } catch (err) {
            console.error("Failed to load current user:", err);
          }
        };
  
        await loadUser();
      }

        // Get current user
      const storedUser = localStorage.getItem('currentUser');
      // const usern = currentUser.username;
      if (storedUser) { // if this is null, guest user, thus no daily feed
        setCurrentUser(JSON.parse(storedUser));
        // setCurrentUser(storedUser);
        console.log(JSON.parse(storedUser));
        console.log(currentUser);
        // const usern = currentUser.username;
        
        const fetchDigest = async () => {
          try {
            const res = await fetch(`/api/digest`, {
              method: "GET",
            });
        
            if (!res.ok) {
              console.log("Failed to fetch digest");
              return;
            }
        
            const data = await res.json();
            console.log("digest response:", data);
            setDigest(data.message);
          } catch (err) {
            console.error("Digest error:", err);
          }
        };
      

        // Mock API call to /api/social/threads/general
        const fetchThreads = async () => {
          setLoading(true);
          if (JSON.parse(storedUser).username !== 'Guest') {

          
            const response = await fetch(`/api/user/${JSON.parse(storedUser).username}/feed`, {
              method: 'GET',
            });
            const data = await response.json();

            if (!response.ok) {
              alert(data.error);
              setLoading(false);
            } else {
              console.log(data);
              setTimeout(() => {
                const threads: Thread[] = 
                  data.followed.flatMap((follow: any) => {
                    const user = follow.follow;
                    console.log(user);
                    return user.threads.map((thread: any ) => ({
                      id: thread.tid,
                      title: thread.title,
                      author: {
                        username: user.username,
                        avatar: user.avatar,
                      },
                      content: thread.text,
                      timestamp: thread.date,

                    }))
                  })
                
                console.log(threads)
                const t = data.fav;
                if (t) {
                  const team: Team = {
                    tid: t.tid,
                    logo: t.logo,
                    position: t.position,
                    team: t.name,
                    played: t.playedGames,
                    won: t.wins,
                    drawn: t.draws,
                    lost: t.losses,
                    goalsFor: t.goalsFor,
                    goalsAgainst: t.goalsAgainst,
                    goalDifference: t.goalsFor - t.goalsAgainst,
                    points: t.points,
                    // form: t.form,
                  };

                
                  
                  setThreads(threads);
                  setTeamStats(team);
                  setLoading(false);
                } else {
                  // alert("User needs a favorite team");
                  setLoading(false);
                }

              }, 500);
            }
          } else {
            setLoading(false);
          }
        };
        fetchDigest();
        fetchThreads();
      }
    }
  init();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const handleUserClick = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (username !== "Guest") {

    
      router.push(`/user/${username}`);
    }
  };

  const handleLogout = async () => {

    const response = await fetch('/api/logout', {method: 'POST'});
    if (!response.ok) {
      const err = await response.json();
      alert(err.error);
    } else {
      // Clear all user data from localStorage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('accessToken');
      // Navigate back to login page
      router.push('/');
    }
    
  };

    const getPositionBadgeColor = (position: number) => {
    if (position <= 4) return 'bg-blue-600 text-white';
    if (position <= 6) return 'bg-orange-600 text-white';
    if (position >= 18) return 'bg-red-600 text-white';
    return 'bg-gray-600 text-white';
  };

    const getFormResultColor = (result: string) => {
    if (result === 'W') return 'bg-green-600';
    if (result === 'D') return 'bg-yellow-600';
    if (result === 'L') return 'bg-red-600';
    return 'bg-gray-600';
  };
  
  return (
    // <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
    <div className="min-h-screen w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50">
      {/* Header */}
      <div className=" dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 shadow-sm">
              {/* <div className="bg-white dark:bg-slate-900 border-b shadow-sm"> */}

        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl mb-1">Premier League Forum</h1>
              <p className="text-muted-foreground">General Discussion</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle/>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowUserSearch(true)}
                className="h-10 w-10"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
              <Avatar 
                className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                // onClick={() => router.push('/account')}

                // onClick={() => router.push(`/user/${currentUser.username}`)}
                onClick={() => {
                  console.log(currentUser);
                  if (currentUser) {
                    if (currentUser.isGuest) {
                      alert("Please login to view account page");
                      router.push(`/`);
                    } else {
                      router.push(`/user/${currentUser.username}`)
                    }
                    
                  } else {
                    alert("Please login to view account page");
                    router.push(`/`);
                  }
                }}
              >
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/search')}
              className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Threads
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/matches')}
              className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Matches
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/teams')}
              className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Teams
            </Button>
            {currentUser?.isAdmin && (
              <Button
                variant="outline"
                onClick={() => router.push('/moderation')}
                className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-950"
              >
                <Shield className="h-4 w-4" />
                Moderation
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
       <div className="max-w-6xl mx-auto px-4 py-8">
       {digest && (
          <Card className="mb-8 border-2 border-blue-500 bg-blue-50 dark:bg-blue-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📰 Daily Digest
              </CardTitle>
              <CardDescription>
                AI-generated summary of today's activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed whitespace-pre-line">
                {digest}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Favorite Team Stats Section */}
        {teamStats && (
          <Card className="mb-8 overflow-hidden border-2">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Trophy className="h-6 w-6" />
                    {teamStats.team}
                  </CardTitle>
                  <CardDescription className="text-slate-900 dark:text-slate-100 mt-1">
                    2025/26 Premier League Season
                  </CardDescription>
                </div>
                <Badge className={`text-lg px-4 py-2 ${getPositionBadgeColor(teamStats.position)}`}>
                  {teamStats.position}
                  {teamStats.position === 1 ? 'st' : teamStats.position === 2 ? 'nd' : teamStats.position === 3 ? 'rd' : 'th'} Place
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Main Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="text-2xl mb-1">{teamStats.points}</div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="text-2xl mb-1">{teamStats.played}</div>
                  <div className="text-xs text-muted-foreground">Played</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl mb-1 text-green-700 dark:text-green-400">{teamStats.won}</div>
                  <div className="text-xs text-muted-foreground">Won</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="text-2xl mb-1 text-yellow-700 dark:text-yellow-400">{teamStats.drawn}</div>
                  <div className="text-xs text-muted-foreground">Drawn</div>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-2xl mb-1 text-red-700 dark:text-red-400">{teamStats.lost}</div>
                  <div className="text-xs text-muted-foreground">Lost</div>
                </div>
              </div>

              {/* Goals and Form Section */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Goals Stats */}
                <div>
                  <h3 className="text-sm mb-3 text-muted-foreground">Goal Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded">
                      <span className="text-sm">Goals For</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        {teamStats.goalsFor}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded">
                      <span className="text-sm">Goals Against</span>
                      <span className="flex items-center gap-1">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        {teamStats.goalsAgainst}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950 rounded">
                      <span className="text-sm">Goal Difference</span>
                      <span className="text-slate-900 dark:text-slate-700 dark:text-slate-900 dark:text-slate-400">
                        {teamStats.goalDifference > 0 ? '+' : ''}{teamStats.goalDifference}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Form and Results */}
                {/* <div>
                  <h3 className="text-sm mb-3 text-muted-foreground">Recent Form (Last 5 Matches)</h3>
                  <div className="flex gap-2 mb-4">
                    {teamStats.form.map((result, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-center w-10 h-10 rounded-full text-white ${getFormResultColor(result)}`}
                      >
                        {result}
                      </div>
                    ))}
                  </div> */}
                  {/* <div className="space-y-2">
                    {teamStats.recentResults.map((match, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-slate-50 dark:bg-slate-900 rounded">
                        <span>vs {match.opponent}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{match.score}</span>
                          <Badge variant={match.result === 'W' ? 'default' : match.result === 'D' ? 'secondary' : 'destructive'} className="w-6 h-6 flex items-center justify-center p-0">
                            {match.result}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div> */}
                {/* </div> */}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Threads Section */}
        {/* <div> */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading threads...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* {threads.map()} */}
            {threads.map((thread) => (
              <Card
                key={thread.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => console.log('Open thread:', thread.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 flex-1">
                      <Avatar className="h-10 w-10 mt-1">
                        <AvatarImage src={thread.author?.avatar} />
                        <AvatarFallback>
                          {getInitials(thread.author?.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-xl">
                            {thread.title}
                          </CardTitle>
                          {/* <Badge variant="secondary" className="text-xs">
                            {thread.category}
                          </Badge> */}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span
                              className="cursor-pointer hover:underline hover:text-foreground"
                              onClick={(e) => handleUserClick(thread.author.username, e)}
                            >
                              {thread.author.username}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(thread.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-3">
                    {thread.content}
                  </CardDescription>
                  {/* <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{thread.replies} replies</span>
                  </div> */}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
      {/* User Search Dialog */}
      <UserSearchDialog open={showUserSearch} onOpenChange={setShowUserSearch} />
    </div>
  );
}