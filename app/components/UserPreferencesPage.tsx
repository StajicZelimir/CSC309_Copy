"use client";

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { User, Trophy } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useRouter, useSearchParams } from 'next/navigation';

export function UserPreferencesPage() {

  
  const [soccerTeams, setSoccerTeams] = useState<string[]>([]);
  const [teamDictionary, setTeamDictionary] = useState<Record<string, number>>({});

  useEffect(() => {
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

        standings.forEach((team: any) => {
          teams.push(team.name);
          dictionary[team.name] = team.tid;
        });

        console.log(data);
        teams.sort();
        setSoccerTeams(teams);
        setTeamDictionary(dictionary);
      } catch (err) {
        console.error('Failed to load teams:', err);
      }
    };

    loadTeams();
  }, []);

  const router = useRouter();
  // const navigate = useNavigate();
  const search = useSearchParams();
  // const location = useLocation(); // to get the passed in data from signup
  const email = search.get("email");
  const password = search.get("password");
  const [username, setUsername] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('');

  const postData = async (formData: any) => {
      const response = await fetch('/api/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      return await response;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle saving preferences
    console.log('User preferences:', { username, favoriteTeam });
    console.log({
      favoriteTeam,
      favTid: teamDictionary[favoriteTeam],
    });
    const formData = {
      "email": email,
      "password": password,
      "username": username,
      "fav": teamDictionary[favoriteTeam],
    }
    console.log(formData)
    const response1 = await postData(formData); // cookies set in api
    const response = await response1.json();
    if (!response1.ok) {
      console.log(response);
      alert(response.error);
    } else {
      console.log(response);

        // Set user as logged in
      localStorage.setItem('currentUser', JSON.stringify({
        uid:response.uid,
        username: response.username,
        email: response.email,
        isGuest: false,
        isAdmin: response.role === 'admin',
        isBanned: response.isBan,
        avatar: response.avatar,
        favoriteTeam: response.favId,
        createdAt: response.createdAt,
      //   followers: -1,
      //   following: -1,
      }));
      
      // Navigate to main page after completing setup
      router.push('/main');
    }
    
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1625187538367-6a8483a79cc2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2NjZXIlMjBiYWxsJTIwZmllbGR8ZW58MXx8fHwxNzczNTM1MDIyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
        }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Preferences Card */}
      <Card className="w-full max-w-md relative z-10 shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Tell us a bit more about yourself
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username">Choose a username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                  pattern="^[a-zA-Z0-9_]{3,20}$"
                  title="Username must be 3-20 characters and can only contain letters, numbers, and underscores"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

            {/* Favorite Team Field */}
            <div className="space-y-2">
              <Label htmlFor="favoriteTeam">Select your favorite soccer team</Label>
              <div className="relative">
                <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select value={favoriteTeam} onValueChange={setFavoriteTeam} required>
                  <SelectTrigger id="favoriteTeam" className="pl-10">
                    <SelectValue placeholder="Choose your team" />
                  </SelectTrigger>
                  <SelectContent>
                    {soccerTeams.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button type="submit" className="w-full">
                Complete Setup
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}