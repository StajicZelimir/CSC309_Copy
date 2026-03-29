import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Search, User, Shield, Ban } from 'lucide-react';
import { Badge } from './ui/badge';
import { useRouter } from 'next/navigation';

interface Follower {
  userId: number;
  followId: number;
  followTime: string;
  user: any;
}

interface UserSearchResult {
  username: string;
  avatar?: string;
  favoriteTeam?: string;
  isAdmin: boolean;
  isBanned: boolean;
  followers: Follower[];
}

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserSearchDialog({ open, onOpenChange }: UserSearchDialogProps) {
//   const navigate = useNavigate();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    // Search
    setTimeout(async () => {
        const response = await fetch(`/api/user`); // Your API endpoint
        const data = await response.json();
        if (!response.ok) {
          alert(data.error + " Please Try Again Later.");
        }
        console.log(data);
        if (response.ok) {
            const users: UserSearchResult[] = data;
            // Filter based on search query
            try {
                const filtered = users.filter(user =>
                    user.username.toLowerCase().includes(searchQuery.toLowerCase())
                );
                console.log("filtered:", filtered);
                setSearchResults(filtered);
            } catch (error) {
                // console.log("users:", users);
                alert("No User found");
                setSearchResults([]);
            }
            
            setIsSearching(false);
        }
      

      
    }, 500);
  };

  const handleUserClick = (username: string) => {
    router.push(`/user/${username}`);
    onOpenChange(false);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50">
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
       <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-slate-50">Search Users</DialogTitle>
        <DialogDescription>
            Find users by their username
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
              autoFocus
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Searching...</p>
            </div>
          ) : hasSearched && searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2 mt-4">
              {searchResults.map((user) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  onClick={() => handleUserClick(user.username)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{user.username}</p>
                        {user.isAdmin && (
                          <Badge variant="default" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {user.isBanned && (
                          <Badge variant="destructive" className="text-xs">
                            <Ban className="h-3 w-3 mr-1" />
                            Banned
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {user.favoriteTeam && (
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {user.favoriteTeam}
                          </span>
                        )}
                       <span>{user.followers?.length || 0} followers</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Profile
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Enter a username to search</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}
