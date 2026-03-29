import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ArrowLeft, Calendar, User, Clock, MessageSquare } from 'lucide-react';
import { Badge } from './ui/badge';

interface Post {
  id: string;
  author: {
    username: string;
  };
  content: string;
  timestamp: string;
  likes: number;
}

export function DailyForumPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  useEffect(() => {
    // Mock API call
    setTimeout(() => {
      const mockPosts: Post[] = [
        {
          id: '1',
          author: { username: 'your_username' },
          content: 'Looking forward to the matches today! Hoping my team can get all 3 points.',
          timestamp: new Date().toISOString(),
          likes: 12,
        },
        {
          id: '2',
          author: { username: 'supporter_123' },
          content: 'The atmosphere at the stadium yesterday was incredible! Best match of the season.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          likes: 8,
        },
        {
          id: '3',
          author: { username: 'football_fan_92' },
          content: 'Can\'t believe that referee decision... completely changed the game.',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          likes: 24,
        },
      ];
      
      setPosts(mockPosts);
      setLoading(false);
    }, 500);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      return `${diffInHours}h ago`;
    }
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const handleUserClick = (username: string) => {
    navigate(`/user/${username}`);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/main')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to General
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl">My Daily Forum</h1>
              <p className="text-muted-foreground">{currentDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* New Post Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Share your thoughts</CardTitle>
            <CardDescription>What's on your mind today?</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-24 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Write something..."
            />
            <div className="flex justify-end mt-3">
              <Button onClick={() => console.log('Post created')}>
                Post
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(post.author.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="font-semibold cursor-pointer hover:underline"
                          onClick={() => handleUserClick(post.author.username)}
                        >
                          {post.author.username}
                        </span>
                        {post.author.username === 'your_username' && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(post.timestamp)}
                        </span>
                      </div>
                      <p className="text-base mb-3">{post.content}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                          <MessageSquare className="h-4 w-4" />
                          Reply
                        </button>
                        <span>{post.likes} likes</span>
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
  );
}