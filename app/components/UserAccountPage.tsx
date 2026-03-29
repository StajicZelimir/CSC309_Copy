"use client";

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ArrowLeft, User, Camera, Edit2, UserPlus, UserMinus, Shield, Ban, MessageSquare, Clock, Users, Check } from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useRouter } from 'next/navigation';
import { profile } from 'console';

interface UserProfile {
  username: string;
  email: string;
  avatar?: string;
  favoriteTeam: string | null;
  followers: number;
  following: number;
  isGuest: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  banReason?: string;
  bio?: string;
  joinedDate: string;
}

interface UserPost {
  id: string;
  type: 'thread' | 'post' | 'reply';
  title?: string;
  content: string;
  timestamp: string;
  replies?: number;
  likes?: number;
}

interface FollowUser {
  // username: string;
  // avatar?: string;
  // favoriteTeam?: string;
  user: fUser;
  followTime: string;
  isFollowing?: boolean;
}

interface fUser {
  username: string;
  avatar?: string;
  favoriteTeam?: string;
}

// const premierLeagueTeams = [
//   'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton & Hove Albion',
//   'Chelsea', 'Everton', 'Fulham', 'Liverpool', 'Luton Town',
//   'Manchester City', 'Manchester United', 'Newcastle United', 'Nottingham Forest',
//   'Sheffield United', 'Tottenham Hotspur', 'West Ham United', 'Wolverhampton Wanderers'
// ];

export function UserAccountPage( {usernameParam}: any ) {

  const [soccerTeams, setSoccerTeams] = useState<string[]>([]);
  const [teamDictionary, setTeamDictionary] = useState<Record<string, number>>({});
  const [idDictionary, setIdDictionary] = useState<Record<number, string>>({});


  // useEffect(() => {
  //   const loadTeams = async () => {
  //     try {
  //       const response = await fetch('/api/sports/standings', {
  //         method: 'GET',
  //       });

  //       if (!response.ok) {
  //         console.error('Failed to fetch standings');
  //         return;
  //       }

  //       const data = await response.json();
  //       const standings = data.standings || [];

  //       const teams: string[] = [];
  //       const dictionary: Record<string, number> = {};
  //       const iddictionary: Record<number, string> = {};

  //       standings.forEach((team: any) => {
  //         teams.push(team.name);
  //         dictionary[team.name] = team.tid;
  //         iddictionary[team.tid] = team.name;
  //       });

  //       // console.log(data);
  //       teams.sort();
  //       setSoccerTeams(teams);
  //       setTeamDictionary(dictionary);
  //       setIdDictionary(iddictionary);
  //       // console.log(teams);
  //       // console.log(dictionary);
  //       console.log(iddictionary);
  //     } catch (err) {
  //       console.error('Failed to load teams:', err);
  //     }
  //   };

  //   loadTeams();
  // }, []);

  // const navigate = useNavigate();
  const router = useRouter();
  // const param = useParams();
  // console.log(param);
  const username = usernameParam;
  // const { username } = param?.username as string;
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Dialogs
  const [showEditAvatar, setShowEditAvatar] = useState(false);
  const [showEditUsername, setShowEditUsername] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showBanAppeal, setShowBanAppeal] = useState(false);
  
  // Edit states
  const [newAvatar, setNewAvatar] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [banAppealText, setBanAppealText] = useState('');
  
  // User posts
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);

  useEffect(() => {
    const initProfile = async () => {
      setLoading(true);
      const tempDict = await loadTeams();
      // Get current logged-in user
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        console.log(user);
        // console.log(username);
        
        // If no username in URL or it matches current user, show own profile
        if (!username || username === user.username) {
          setIsOwnProfile(true);
          await fetchUserProfile(user.username, tempDict);
          // setCurrentUser(profileUser);
          // setProfileUser(user);
        } else {
          // Fetch other user's profile
          setIsOwnProfile(false);
          await fetchUserProfile(username, tempDict);
        }
      } else if (username) {
        setIsOwnProfile(false);
        // Not logged in but trying to view another user's profile
        await fetchUserProfile(username, tempDict);
      }
      
      setLoading(false);
    }
    initProfile();
  }, [username]);

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

        const teams: string[] = [];
        const dictionary: Record<string, number> = {};
        const iddictionary: Record<number, string> = {};

        standings.forEach((team: any) => {
          teams.push(team.name);
          dictionary[team.name] = team.tid;
          iddictionary[team.tid] = team.name;
        });

        // console.log(data);
        teams.sort();
        setSoccerTeams(teams);
        setTeamDictionary(dictionary);
        setIdDictionary(iddictionary);
        // console.log(teams);
        // console.log(dictionary);
        console.log(iddictionary);
        return iddictionary;
      } catch (err) {
        console.error('Failed to load teams:', err);
      }
    };

  const fetchUserProfile = async (targetUsername: string, tempDict: Record<number, string> | undefined) => {

    // try {
        const response = await fetch(`/api/user/${targetUsername}`); // Your API endpoint
        const data = await response.json();
        if (!response.ok) {
          alert(data.error + " Please Try Again Later.");
        }
        
        console.log(data);
        // console.log(idDictionary);
        console.log(tempDict);
        let fav = idDictionary[data.favId] || "No Favorite Team";
        console.log(fav)
        if (fav === "No Favorite Team") {
          if (tempDict) {
            
             fav = tempDict[data.favId] || "No Favorite Team";
             console.log(fav)
          } else {
            fav = "No Favorite Team";
          }
         
        }

        const user: UserProfile = {
          username: data.username,
          email: data.email,
          avatar: data.avatar,
          favoriteTeam: fav,
          followers: data.followers.length,
          following: data.followed.length,
          isGuest: false,
          isAdmin: data.role === 'admin',
          isBanned: data.isBan,
          banReason: targetUsername === 'banneduser' ? 'Violation of community guidelines' : undefined,
          joinedDate: data.createdAt,
        };

    
    setProfileUser(user);
    
  //   interface UserPost {
  // id: string;
  // type: 'thread' | 'post' | 'reply';
  // title?: string;
  // content: string;
  // timestamp: string;
  // replies?: number;
  // likes?: number;
// }
    setUserPosts([
      ...data.threads.map((thread: any) => {
        return {
          id: thread.tid,
          type: 'thread',
          // title: thread.title,
          content: thread.title,
          timestamp: thread.date,

        }
      }),
      ...data.posts.map((post: any) => {
        return {
          id: post.cid,
          type: 'post',
          // title: thread.title,
          content: post.text,
          timestamp: post.date,
          
        }
      }),
    ]);

     setFollowers(
      data.followers.map((follower: any) => ({
        user: {
          username: follower.user.username,
          avatar: follower.user.avatar,
          favoriteTeam: follower.user.favId

        },
        isFollowing: true,
        followTime: follower.followTime,
      }
      ))
    );

    setFollowingList(
      data.followed.map((followed: any) => ({
        user: {
          username: followed.follow.username,
          avatar: followed.follow.avatar,
          favoriteTeam: followed.follow.favId

        },
        followTime: followed.followTime,
      }
      ))
    );
    console.log(user);
  };

  const refresh = async () => {
      const response = await fetch(`/api/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      return await response;
  }

   const putData = async (formData: any) => {
      const response = await fetch(`/api/user/${username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      return await response;
  };

  const handleEditAvatar = async () => {
    const base = "https://robohash.org/";
    const formData = {
      avatar: base + newAvatar,
    }
    let response = await putData(formData);
    if (response.status === 401) {
      const refreshResponse = await refresh();
      if (refreshResponse.status === 401) {
        alert("Login time expired, please login again.");
        router.push('/');
      } else {
        response = await putData(formData);
      }
    }
    if (!response.ok) {
      
      const err = await response.json();
      
      alert(err.error);
    }
    if (newAvatar && profileUser && response.ok) {

      const updatedUser = { ...profileUser, avatar: base + newAvatar };
      setProfileUser(updatedUser);
      if (currentUser) {
        const updatedCurrent = { ...currentUser, avatar: base + newAvatar };
        setCurrentUser(updatedCurrent);
        // setProfileUser(updatedCurrent);
        localStorage.setItem('currentUser', JSON.stringify(updatedCurrent));
      }
      setShowEditAvatar(false);
      setNewAvatar('');
    }
  };

  const handleEditUsername = async () => {
    const newU = newUsername;
     const formData = {
      updatedUsername: newUsername,
    }
    let response = await putData(formData);
    if (response.status === 401) {
      const refreshResponse = await refresh();
      if (refreshResponse.status === 401) {
        alert("Login time expired, please login again.");
        router.push('/');
      } else {
        response = await putData(formData);
      }
    }
    if (!response.ok) {
      // console.log(await response.text());
      const err = await response.json();
      alert(err.error);
      router.push("/main");
    } else {

      if (newUsername && profileUser && response.ok) {
        
        const updatedUser = { ...profileUser, username: newUsername };
        setProfileUser(updatedUser);
        if (currentUser) {
          const updatedCurrent = { ...currentUser, username: newUsername };
          setCurrentUser(updatedCurrent);
          localStorage.setItem('currentUser', JSON.stringify(updatedCurrent));
        }
        setShowEditUsername(false);
        
        setNewUsername('');
        
        alert("Updated username");
        router.push(`/user/${newU}`);
        
      }
    }
  };

  const handleEditTeam = async () => {
     const formData = {
      fav: teamDictionary[newTeam],
    }
    let response = await putData(formData);
    if (response.status === 401) {
      const refreshResponse = await refresh();
      if (refreshResponse.status === 401) {
        alert("Login time expired, please login again.");
        
        router.push('/');
      } else {
        response = await putData(formData);
      }
    }
    if (!response.ok) {
      
      const err = await response.json();
      alert(err.error);
    }

    if (newTeam && profileUser && response.ok) {
      const updatedUser = { ...profileUser, favoriteTeam: newTeam };
      setProfileUser(updatedUser);
      if (currentUser) {
        const updatedCurrent = { ...currentUser, favoriteTeam: newTeam };
        setCurrentUser(updatedCurrent);
        localStorage.setItem('currentUser', JSON.stringify(updatedCurrent));
      }
      setShowEditTeam(false);
      setNewTeam('');
    }
  };


  const followPost = async (formData: any) => {
    // @ts-ignore
      const response = await fetch(`/api/user/${currentUser.username}/follow`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      return await response;
  };

  const handleFollow = async () => {
    
    if (currentUser) { // only logged in users can follow others
      console.log(currentUser);
      console.log(profileUser);
      const formData = {
        follow: profileUser?.username
      }
      let response = await followPost(formData);
      if (response.status === 401) {
        const refreshResponse = await refresh();
        if (refreshResponse.status === 401) {
          alert("Login time expired, please login again.");
          router.push('/');
        } else {
          response = await putData(formData);
        }
      }
      if (!response.ok) {
        const err = await response.json();
        alert(err.error);
      }
      if (response.ok) {
        alert("Followed!");
        setIsFollowing(!isFollowing);
        if (profileUser) {
          setProfileUser({
            ...profileUser,
            followers: isFollowing ? profileUser.followers - 1 : profileUser.followers + 1,
          });
        }
      }
    }
    
  };

  const makeAdminPost = async (formData: any) => {
    // @ts-ignore
      const response = await fetch(`/api/admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      return await response;
  };

  const handleMakeAdmin = async () => {
    if (currentUser) {
      if (currentUser?.isAdmin) {
        if (profileUser) {
          const formData = {
            username: profileUser.username,
          }
          let response = await makeAdminPost(formData);
          if (response.status === 401) {
            const refreshResponse = await refresh();
            if (refreshResponse.status === 401) {
              alert("Login time expired, please login again.");
              router.push('/');
            } else {
              response = await putData(formData);
            }
          }
          if (!response.ok) {
            const err = await response.json();
            alert(err.error);
          }
          if (response.ok) {
            
            setProfileUser({ ...profileUser, isAdmin: true });
            alert(`Made ${profileUser.username} an admin`);

          }
        }
      }
    }
    
  };

  const removeFollowPost = async (formData: any) => {
      // @ts-ignore
      const response = await fetch(`/api/user/${currentUser.username}/removefollower`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      return await response;
  };

  const handleRemoveFollower = async (username: string) => {
    if (currentUser) {
      const formData = {
        follow: username,
      }
      let response = await removeFollowPost(formData);
      if (response.status === 401) {
        const refreshResponse = await refresh();
        if (refreshResponse.status === 401) {
          alert("Login time expired, please login again.");
          router.push('/');
        } else {
          response = await putData(formData);
        }
      }
      if (!response.ok) {
        const err = await response.json();
        alert(err.error);
      }
      if (response.ok) {
        // alert("Removed follower");
        setFollowers(followers.filter(f => f.user.username !== username));
        if (profileUser) {
          setProfileUser({ ...profileUser, followers: profileUser.followers - 1 });
        }
      }
    }
  };



  const unfollowPost = async (formData: any) => {
      // @ts-ignore
      const response = await fetch(`/api/user/${currentUser.username}/unfollow`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      return await response;
  };

  const handleUnfollow = async (username: string) => {
    if (currentUser) {
      const formData = {
        follow: username,
      }
      let response = await unfollowPost(formData);
      if (response.status === 401) {
        const refreshResponse = await refresh();
        if (refreshResponse.status === 401) {
          alert("Login time expired, please login again.");
          router.push('/');
        } else {
          response = await putData(formData);
        }
      }
      if (!response.ok) {
        const err = await response.json();
        alert(err.error);
      }
      if (response.ok) {
        alert("Unfollowed");
        setFollowingList(followingList.filter(f => f.user.username !== username));
        if (profileUser) {
          setProfileUser({ ...profileUser, following: profileUser.following - 1 });
        }
      }
    }
  };

  const handleFollowBack = async (username: string) => {
    if (currentUser) {
      const formData = {
        follow: profileUser?.username
      }
      let response = await followPost(formData);
      if (response.status === 401) {
        const refreshResponse = await refresh();
        if (refreshResponse.status === 401) {
          alert("Login time expired, please login again.");
          router.push('/');
        } else {
          response = await putData(formData);
        }
      }
      if (!response.ok) {
        const err = await response.json();
        alert(err.error);
      }
      if (response.ok) {
        setFollowers(followers.map(f => 
          f.user.username === username ? { ...f, isFollowing: !f.isFollowing } : f
        ));
      }
    }
  };

  const makeAppealPost = async (formData: any) => {
      // @ts-ignore
      const response = await fetch(`/api/user/${currentUser.username}/appeal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      return await response;
  };

  const handleSubmitAppeal = async () => {
    if (currentUser) {
      if (profileUser && profileUser.isBanned && isOwnProfile) { // only banned users can submit an appeal
        const formData = {
          appeal: banAppealText,
        }
        let response = await makeAppealPost(formData);
        if (response.status === 401) {
          const refreshResponse = await refresh();
          if (refreshResponse.status === 401) {
            alert("Login time expired, please login again.");
            router.push('/');
          } else {
            response = await makeAppealPost(formData);
          }
        }
        if (!response.ok) {
          const err = await response.json();
          alert(err.error);
        }
        if (response.ok) {
          alert('Ban appeal submitted:' + banAppealText);
          setShowBanAppeal(false);
          setBanAppealText('');
        }
      } else {
        alert("Only banned users can submit appeals");
        setShowBanAppeal(false);
        setBanAppealText('');
      }
    } else {
      setShowBanAppeal(false);
      setBanAppealText('');
    }
    
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  if (loading || !profileUser) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  // If trying to view own account (/account) but not logged in or is a guest, show login prompt
  if (isOwnProfile && (!currentUser || currentUser.isGuest)) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="bg-white dark:bg-slate-900 border-b shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/main')}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forum
            </Button>
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">Login Required</h2>
              <p className="text-muted-foreground mb-6">
                You need to be logged in to view your account page
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => router.push('/')}>
                  Login
                </Button>
                <Button variant="outline" onClick={() => router.push('/signup')}>
                  Sign Up
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/main')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forum
          </Button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={profileUser.avatar} />
                    <AvatarFallback className="text-3xl">
                      
                      {getInitials(profileUser.username)}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && !profileUser.isGuest && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full h-10 w-10 p-0"
                      onClick={() => setShowEditAvatar(true)}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {profileUser.isBanned && (
                  <Badge variant="destructive" className="mt-4">
                    <Ban className="h-3 w-3 mr-1" />
                    BANNED
                  </Badge>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl">{profileUser.username}</h1>
                      {isOwnProfile && !profileUser.isGuest && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setNewUsername(profileUser.username);
                            setShowEditUsername(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {profileUser.isAdmin && (
                        <Badge variant="default">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {profileUser.isGuest && (
                        <Badge variant="secondary">Guest</Badge>
                      )}
                    </div>
                    {profileUser.bio && (
                      <p className="text-muted-foreground mb-3">{profileUser.bio}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {profileUser.favoriteTeam && (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>{profileUser.favoriteTeam}</span>
                          {isOwnProfile && !profileUser.isGuest && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setNewTeam(profileUser.favoriteTeam || '');
                                setShowEditTeam(true);
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                      <span>Joined {formatTimestamp(profileUser.joinedDate || '2026-01-01')}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {!isOwnProfile && !profileUser.isGuest && (
                      <Button
                        variant={isFollowing ? 'outline' : 'default'}
                        onClick={handleFollow}
                        className="flex items-center gap-2"
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="h-4 w-4" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                    {!isOwnProfile && currentUser?.isAdmin && !profileUser.isAdmin && (
                      <Button
                        variant="outline"
                        onClick={handleMakeAdmin}
                        className="flex items-center gap-2"
                      >
                        <Shield className="h-4 w-4" />
                        Make Admin
                      </Button>
                    )}
                    {isOwnProfile && profileUser.isBanned && (
                      <Button
                        variant="outline"
                        onClick={() => setShowBanAppeal(true)}
                        className="flex items-center gap-2"
                      >
                        Submit Appeal
                      </Button>
                    )}
                  </div>
                </div>

                {/* Ban Message */}
                {profileUser.isBanned && profileUser.banReason && (
                  <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 mb-4">
                    <CardContent className="p-4">
                      <p className="text-sm">
                        <span className="font-semibold">Ban Reason:</span> {profileUser.banReason}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Stats */}
                <div className="flex gap-6 mt-4">
                  <button
                    className="text-center hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded transition-colors"
                    onClick={() => setShowFollowers(true)}
                  >
                    <p className="text-2xl font-semibold">{profileUser.followers}</p>
                    <p className="text-sm text-muted-foreground">Followers</p>
                  </button>
                  <button
                    className="text-center hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded transition-colors"
                    onClick={() => setShowFollowing(true)}
                  >
                    <p className="text-2xl font-semibold">{profileUser.following}</p>
                    <p className="text-sm text-muted-foreground">Following</p>
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Activity Tabs */}
        {!profileUser.isGuest && (
          <Tabs defaultValue="threads" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="threads">Threads</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              {/* <TabsTrigger value="replies">Replies</TabsTrigger> */}
            </TabsList>

            <TabsContent value="threads" className="space-y-4 mt-4">
              {userPosts
                .filter(post => post.type === 'thread')
                .map(post => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(post.timestamp)}
                        </span>
                        {/* {post.replies !== undefined && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post.replies} replies
                          </span>
                        )} */}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{post.content}</p>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="posts" className="space-y-4 mt-4">
              {userPosts
                .filter(post => post.type === 'post')
                .map(post => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <p className="mb-3">{post.content}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(post.timestamp)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            {/* <TabsContent value="replies" className="space-y-4 mt-4">
              {userPosts
                .filter(post => post.type === 'reply')
                .map(post => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <p className="mb-3">{post.content}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(post.timestamp)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent> */}
          </Tabs>
        )}
      </div>

      {/* Edit Avatar Dialog */}
      <Dialog open={showEditAvatar} onOpenChange={setShowEditAvatar}>
        <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-50">Update Profile Picture</DialogTitle>
            <DialogDescription>
               Enter a word to generate your profile picture.
              {/* Enter the URL of your new profile picture */}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              {/* <Label htmlFor="avatar">Image URL</Label> */}
              <Label htmlFor="avatar">Image Prompt</Label>
              <Input
                id="avatar"
                placeholder='Courtesy of https://robohash.org/'
                // placeholder="https://example.com/avatar.jpg"
                value={newAvatar}
                onChange={(e) => setNewAvatar(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditAvatar(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAvatar}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Username Dialog */}
      <Dialog open={showEditUsername} onOpenChange={setShowEditUsername}>
        <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-50">Update Username</DialogTitle>
            <DialogDescription>
              Choose a new username for your account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">New Username</Label>
              <Input
                id="username"
                placeholder="Enter new username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUsername(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUsername}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={showEditTeam} onOpenChange={setShowEditTeam}>
        <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-50">Update Favorite Team</DialogTitle>
            <DialogDescription className="text-slate-900 dark:text-slate-50">
              Select your favorite Premier League team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="team">Favorite Team</Label>
              <Select value={newTeam} onValueChange={setNewTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
                  {soccerTeams.map(team => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTeam(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTeam}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Followers Dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-50">Followers</DialogTitle>
            <DialogDescription className="text-slate-900 dark:text-slate-50">
              {profileUser.followers} {profileUser.followers === 1 ? 'person follows' : 'people follow'} {isOwnProfile ? 'you' : profileUser.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {followers.map(follower => (
              <div key={follower.user.username} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 cursor-pointer" onClick={() => {
                    setShowFollowers(false);
                    router.push(`/user/${follower.user.username}`);
                  }}>
                    <AvatarImage src={follower.user.avatar} />
                    <AvatarFallback>{getInitials(follower.user.username)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p 
                      className="font-medium cursor-pointer hover:underline"
                      onClick={() => {
                        setShowFollowers(false);
                        router.push(`/user/${follower.user.username}`);
                      }}
                    >
                      {follower.user.username}
                    </p>
                    {follower.user.favoriteTeam && (
                      <p className="text-xs text-muted-foreground">{follower.user.favoriteTeam}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isOwnProfile && (
                    <>
                      {follower.isFollowing ? (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Following
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFollowBack(follower.user.username)}
                        >
                          Follow Back
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveFollower(follower.user.username)}
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-50">Following</DialogTitle>
            <DialogDescription className="text-slate-900 dark:text-slate-50">
              {isOwnProfile ? 'You are' : `${profileUser.username} is`} following {profileUser.following} {profileUser.following === 1 ? 'person' : 'people'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {followingList.map(user => (
              <div key={user.user.username} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 cursor-pointer" onClick={() => {
                    setShowFollowing(false);
                    router.push(`/user/${user.user.username}`);
                  }}>
                    <AvatarImage src={user.user.avatar} />
                    <AvatarFallback>{getInitials(user.user.username)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p 
                      className="font-medium cursor-pointer hover:underline"
                      onClick={() => {
                        setShowFollowing(false);
                        router.push(`/user/${user.user.username}`);
                      }}
                    >
                      {user.user.username}
                    </p>
                    {user.user.favoriteTeam && (
                      <p className="text-xs text-muted-foreground">{user.user.favoriteTeam}</p>
                    )}
                  </div>
                </div>
                {isOwnProfile && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnfollow(user.user.username)}
                  >
                    Unfollow
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Ban Appeal Dialog */}
      <Dialog open={showBanAppeal} onOpenChange={setShowBanAppeal}>
        <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle  className="text-slate-900 dark:text-slate-50">Submit Ban Appeal</DialogTitle>
            <DialogDescription  className="text-slate-900 dark:text-slate-50">
              Explain why you believe your ban should be lifted
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="appeal">Appeal Message</Label>
              <Textarea
                id="appeal"
                placeholder="Explain your situation..."
                value={banAppealText}
                onChange={(e) => setBanAppealText(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanAppeal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAppeal}>Submit Appeal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}