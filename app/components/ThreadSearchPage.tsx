"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Search, Plus, X, User, Clock, Calendar, Shield, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface Thread {
  tid: number;
  title: string;
  text: string;
  date: string;
  tags: string;
  team: {
    tid:number,
    name:string
  };
  closed: boolean;
  owner: {
    uid: number;
    username: string;
    avatar: string;
  };
}
interface team{
    id:number,
    name:string
}

// Premier League teams

export function ThreadSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    title: false,
    author: false,
    team: false,
    tags: false,
  });
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentUserId,setCurrentUserId] = useState(undefined)
  // Create thread form state
  const [newThread, setNewThread] = useState({
    title: '',
    text: '',
    tags: '',
    teamId: undefined as number | undefined,
  });
  const [soccerTeams, setSoccerTeams] = useState<{id:Number,name:string}[]>([]);
  const [teamDictionary, setTeamDictionary] = useState<Record<string, number>>({});

  const refreshToken = async () =>{
    var response = await fetch("/api/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
    console.log("REFRESHED:")
    console.log(response.status)
    return response.status
  }
  
  const loadTeams = async () => {
    try {
      const response = await fetch('/api/sports/standings', {
        method: 'GET',
      });

      if (!response.ok) {
        console.error('Failed to fetch standings');
        return;
      }

      const data = await response.json();
      const standings = data.standings || [];

      const teams:{id:number, name:string}[] = [];
      const dictionary: Record<string, number> = {};

      standings.forEach((team: any) => {
        teams.push({id:team.tid, name:team.name});
        dictionary[team.name] = team.tid;
      });

      teams.sort();
      setSoccerTeams(teams);
      setTeamDictionary(dictionary);
    } catch (err) {
      console.error('Failed to load teams:', err);
    }
  };

  useEffect(()=>{
    const curr = localStorage.getItem("currentUser")
    if(curr){
        const datajson = JSON.parse(curr)
        if(datajson){
            setCurrentUserId(datajson.uid)
        }
    }
    loadTeams()
    
    
  },[])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    
    // Build query params
    const params = new URLSearchParams({
      search: searchQuery,
      title: filters.title.toString(),
      owner: filters.author.toString(),
      team: filters.team.toString(),
      tag: filters.tags.toString(),
    });

    
    try {
      const response = await fetch(`http://localhost:3000/api/social/threads?${params}`);
      const data = await response.json();
      console.log(data)
      setThreads(data.message || []);
      console.log("hey")
    } catch (error) {
      console.error('Error fetching threads:', error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async () => {
    console.log(newThread)
    if(!currentUserId){
        alert("You must be logged in to make this request")
        router.push("/")
        return
    }

    if (!newThread.title.trim() || !newThread.text.trim()) {
      alert('Please fill in both title and text fields');
      return;
    }
    
    // Parse tags (comma or space separated)
    const tagsArray = []
    for(var i of newThread.tags.split("#")){
        if(i.trim().length > 0){
            tagsArray.push(i.trim())
        }
    }
    
    const payload = {
      title: newThread.title,
      text: newThread.text,
      tags: tagsArray,
      teamId: newThread.teamId,
    };

    try {
      var response = await fetch('/api/social/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if(response.status == 401){
        const refresh = await refreshToken()
        if(refresh == 401){
            alert("Session expired, please log-in again")
            router.push("/")
            return
        }
        response = await fetch('/api/social/threads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
      }
      if (response.ok) {
        const data = await response.json()

        // Reset form
        setNewThread({
          title: '',
          text: '',
          tags: '',
          teamId: undefined,
        });
        setShowCreateForm(false);
        router.push(`/thread/${data.message.tid}`)
        alert("Thread Successfully Created!")
        return
      } else {
        alert('Failed to create thread');
        return
      }
    } catch (error) {
      console.error('Error creating thread:', error);
      alert('Error creating thread');
    }
  };

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
    router.push(`/user/${username}`);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50">
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => router.push('/main')} className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl mb-1">Thread Search</h1>
              <p className="text-muted-foreground">Create or Search threads across the forum</p>
            </div>
            <Button
                variant="default"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2">
                {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showCreateForm ? 'Cancel' : 'Create New Thread'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Create Thread Form */}
        {showCreateForm && (
          <Card className="mb-6 border-2 border-primary">
            <CardHeader>
              <CardTitle>Create New Thread</CardTitle>
              <CardDescription>
                Share your thoughts with the community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="thread-title">Title *</Label>
                <Input
                  id="thread-title"
                  placeholder="Enter thread title..."
                  value={newThread.title}
                  onChange={(e) =>
                    setNewThread({ ...newThread, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="thread-text">Text *</Label>
                <Textarea
                  id="thread-text"
                  placeholder="Enter thread content..."
                  value={newThread.text}
                  onChange={(e) =>
                    setNewThread({ ...newThread, text: e.target.value })
                  }
                  rows={6}
                />
              </div>
              <div>
                <Label htmlFor="thread-tags">Tags</Label>
                <Input
                  id="thread-tags"
                  placeholder="Enter tags starting with a # (e.g. #Hype)"
                  value={newThread.tags}
                  onChange={(e) =>
                    setNewThread({ ...newThread, tags: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="thread-team">Associate with Team (Optional)</Label>
                <Select
                  value={newThread.teamId?.toString() || "none"}
                  onValueChange={(value) =>
                    setNewThread({
                      ...newThread,
                      teamId: value === "none" ? undefined : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="thread-team">
                    <SelectValue placeholder="Select a team (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {soccerTeams.map((team) => (
                      <SelectItem className="bg-gray-500" key={team.id.toString()} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateThread} className="w-full">
                Submit Thread
              </Button>
            </CardContent>
          </Card>
        )}


        {/* Search Section */}
        <Card className="mb-6">
        <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                <CardTitle>Search Threads</CardTitle>
                <CardDescription>
                    Use filters to narrow down your search results
                </CardDescription>
                </div>
            </div>
            </CardHeader>
          
          <CardContent className="space-y-4">
            
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search threads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
              <Search className=""/>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Filter Checkboxes */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-title"
                  checked={filters.title}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, title: checked as boolean })
                  }
                />
                <Label htmlFor="filter-title" className="cursor-pointer">
                  Search in Title
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-author"
                  checked={filters.author}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, author: checked as boolean })
                  }
                />
                <Label htmlFor="filter-author" className="cursor-pointer">
                  Search by Author
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-team"
                  checked={filters.team}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, team: checked as boolean })
                  }
                />
                <Label htmlFor="filter-team" className="cursor-pointer">
                  Search by Team
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-tags"
                  checked={filters.tags}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, tags: checked as boolean })
                  }
                />
                <Label htmlFor="filter-tags" className="cursor-pointer">
                  Search in Tags
                </Label>
              </div>
              
            </div>
          </CardContent>
        </Card>


        {/* Search Results */}
        <div>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Searching threads...</p>
            </div>
          )}

          {!loading && hasSearched && threads.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No threads found matching your search criteria.
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && threads.length > 0 && (
            <div>
              <h2 className="text-2xl mb-4">
                Search Results ({threads.length})
              </h2>
              <div className="space-y-4">
                {threads.map((thread) => (
                  <Card
                    key={thread.tid}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/thread/${thread.tid}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3 flex-1">

                          <Avatar className="h-15 w-15 mt-1">
                            <Avatar className="h-15 w-15 mt-1">
                            <AvatarImage src={(thread.owner.avatar == undefined || thread.owner.avatar== null || thread.owner.avatar == "") ? "https://robohash.org/default" : thread.owner.avatar} alt="User avatar" />
                            </Avatar>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <CardTitle className="text-xl">
                                {thread.title}
                              </CardTitle>
                              
                              {thread.tags && (
                                <Badge variant="secondary" className="text-xs">
                                  {thread.tags}
                                </Badge>
                              )}
                              {thread.closed && (
                                <Badge variant="destructive" className="text-xs">
                                  Closed
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span
                                  className="cursor-pointer hover:underline hover:text-foreground"
                                  onClick={(e) => handleUserClick(thread.owner.username, e)}
                                >
                                  {thread.owner.username}
                                </span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(thread.date)}
                              </span>
                              {thread.team && (
                                <div className="text-blue-600 dark:text-blue-300">{thread.team?.name}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {thread.text.length > 200
                          ? `${thread.text.substring(0, 200)}...`
                          : thread.text}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!loading && !hasSearched && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Enter a search query and click Search to find threads.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}