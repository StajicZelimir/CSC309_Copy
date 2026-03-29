"use client";

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ArrowLeft, Shield, Ban, CheckCircle, XCircle, AlertTriangle, User, MessageSquare } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useRouter } from 'next/navigation';
import { report } from 'process';

interface Report {
  id: string;
  reportedBy: {
    username: string;
    avatar?: string;
  };
  reportedUser: {
    username: string;
    avatar?: string;
  };
  reportedContent: {
    type: 'thread' | 'post';
    title?: string;
    content: string;
    timestamp: string;
  };
  reason: string;
  aiVerdict: string;
  toxicScore: number;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface Appeal {
  id: string;
  user: {
    username: string;
    avatar?: string;
    email: string;
  };
  appealMessage: string;
  // bannedPost: {
  //   type: 'thread' | 'post';
  //   title?: string;
  //   content: string;
  //   timestamp: string;
  // };
  // banReason: string;
  // timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

export function ModerationPage() {
  // const navigate = useNavigate();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    // Check if user is admin
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      
      if (!user.isAdmin) {
        // Not an admin, redirect
        router.push('/main');
        return;
      }
      
      // Fetch moderation data (mock)
      fetchModerationData();
    } else {
      router.push('/');
    }
  }, [router.push]);

const fetchModerationData = async () => {
    let responseReport = await fetch(`/api/admin/report`); // Your API endpoint
    if (responseReport.status === 401) {
      const refreshResponse = await refresh();
      if (refreshResponse.status === 401) {
        alert("Login time expired, please login again.");
        router.push('/');
      } else {
        responseReport = await fetch(`/api/admin/report`);
      }
    }
    const dataReport = await responseReport.json();
    if (!responseReport.ok) {
      alert(dataReport.error + " Please Try Again Later.");
    }
    console.log(dataReport)
    // reports data
    const reports: Report[] = [
      ...dataReport.UserReports.map((report: any) => {
        // used gemini for these two lines (prompt:is there a way to have like a if statemnt in this cuz the aiReports can refer to a comment or a thread, and both are included. if comment is null then its a thread, but otherwise its a comment)
        const isComment = (report.comment !== null);
        const target = isComment ? report.comment : report.thread;
        console.log(target);
        return {
          id: report.rid,
          reportedBy: {
            username: report.user.username,
            avatar: report.user.avatar,
          },
          reportedUser: {
            username: target.owner.username,
            avatar: target.owner.avatar,
          },
          reportedContent: {
            type: isComment? 'post' : 'thread',
            title: target.title,
            content: target.text,
            timestamp: target.date,
          },
          reason: report.text,
          aiVerdict: target.verdict,
          toxicScore: target.toxic,
          timestamp: report.createdAt,
          status: 'pending',
        };
      }),
      ...dataReport.AIReports.map((report: any) => {
        // used gemini for these two lines (prompt:is there a way to have like a if statemnt in this cuz the aiReports can refer to a comment or a thread, and both are included. if comment is null then its a thread, but otherwise its a comment)
        const isComment = (report.comment !== null);
        const target = isComment ? report.comment : report.thread;
        return {
          id: report.rid,
          reportedBy: {
            username: report.user.username,
            avatar: report.user.avatar,
          },
          reportedUser: {
            username: target.owner.username,
            avatar: target.owner.avatar,
          },
          reportedContent: {
            type: isComment? 'post' : 'thread',
            title: target.title,
            content: target.text,
            timestamp: target.date,
          },
          reason: report.text,
          aiVerdict: target.verdict,
          toxicScore: target.toxic,
          timestamp: report.createdAt,
          status: 'pending',
        };
      })
    ];
    console.log(reports);
  
    let responseAppeal = await fetch(`/api/admin/appeal`); // Your API endpoint
    if (responseAppeal.status === 401) {
      const refreshResponse = await refresh();
      if (refreshResponse.status === 401) {
        alert("Login time expired, please login again.");
        router.push('/');
      } else {
        responseAppeal = await fetch(`/api/admin/appeal`);
      }
    }
    const dataAppeal = await responseAppeal.json();
    if (!responseAppeal.ok) {
      alert(dataAppeal.error + " Please Try Again Later.");
    }
    console.log(dataAppeal);
    // appeals data
    const appeals: Appeal[] = 
      dataAppeal.map((appeal: any) => {
        // used gemini for these two lines (prompt:is there a way to have like a if statemnt in this cuz the aiReports can refer to a comment or a thread, and both are included. if comment is null then its a thread, but otherwise its a comment)
        return {
          id: appeal.uid,
          user: {
            username: appeal.username,
            avatar: appeal.avatar,
            email: appeal.email,
          },
          appealMessage: appeal.appeal,
          status: 'pending',
        };
      })
    ;
    console.log(appeals);
   

    setReports(reports);
    setAppeals(appeals);
    setLoading(false);
  };

  const refresh = async () => {
    const response = await fetch(`/api/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    return await response;
  }

  const acceptReportPut = async (formData: any) => {
      const response = await fetch(`/api/admin/report/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      return await response;
  };

  const handleAcceptReport = async (reportId: string) => {
    const formData = {
      rid: reportId,
    }
    let response = await acceptReportPut(formData);
    if (response.status === 401) {
      const refreshResponse = await refresh();
      if (refreshResponse.status === 401) {
        alert("Login time expired, please login again.");
        router.push('/');
      } else {
        response = await acceptReportPut(formData);
      }
    }
    if (!response.ok) {
      const err = await response.json();
      alert(err.error);
    }

    if (response.ok) {
      setReports(reports.map(r => 
        r.id === reportId ? { ...r, status: 'accepted' as const } : r
      ));
        alert('Report accepted: ' + reportId);
    }
    
  };

   const rejectReportPut = async (formData: any) => {
      const response = await fetch(`/api/admin/report/dismiss`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      return await response;
  };

  const handleRejectReport = async (reportId: string) => {
    const formData = {
      rid: reportId,
    }
    let response = await rejectReportPut(formData);
    if (response.status === 401) {
      const refreshResponse = await refresh();
      if (refreshResponse.status === 401) {
        alert("Login time expired, please login again.");
        router.push('/');
      } else {
        response = await rejectReportPut(formData);
      }
    }
    if (!response.ok) {
      const err = await response.json();
      alert(err.error);
    }
    if (response.ok) {
      setReports(reports.map(r => 
        r.id === reportId ? { ...r, status: 'rejected' as const } : r
      ));
      alert('Report rejected: ' + reportId);
    }
    
  };

   const banUser = async (formData: any) => {
      const response = await fetch(`/api/admin/user/ban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      return await response;
  };

  const handleAcceptAndBan = (report: Report) => {
    setSelectedReport(report);
    setBanReason('');
    setShowBanDialog(true);
  };

  const confirmBanUser = async () => {
    if (selectedReport) {
      const formData1 = {
        rid: selectedReport.id,
      }
      let response = await acceptReportPut(formData1);
      if (response.status === 401) {
      const refreshResponse = await refresh();
      if (refreshResponse.status === 401) {
        alert("Login time expired, please login again.");
        router.push('/');
      } else {
        response = await acceptReportPut(formData1);
      }
    }
      if (!response.ok) {
        const err = await response.json();
        alert(err.error);
      }
      if (response.ok) {
        const formData2 = {
          username: selectedReport.reportedUser.username,
        }
        let response = await banUser(formData2);
        if (response.status === 401) {
          const refreshResponse = await refresh();
          if (refreshResponse.status === 401) {
            alert("Login time expired, please login again.");
            router.push('/');
          } else {
            response = await banUser(formData2);
          }
        }
        if (!response.ok) {
          const err = await response.json();
          alert(err.error);
        }
        if (response.ok) {
          setReports(reports.map(r => 
            r.id === selectedReport.id ? { ...r, status: 'accepted' as const } : r
          ));
          alert('User banned: ' + selectedReport.reportedUser.username +  '. Reason: ' + banReason);
          setShowBanDialog(false);
          setSelectedReport(null);
          setBanReason('');
        }
      }
      
    }
  };

  const approveAppealPut = async (formData: any) => {
      const response = await fetch(`/api/admin/appeal/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      return await response;
  };

  const handleApproveAppeal = async (username: string, appealId: string) => {
    const formData = {
      username: username,
    }
    let response = await approveAppealPut(formData);
    if (response.status === 401) {
      const refreshResponse = await refresh();
      if (refreshResponse.status === 401) {
        alert("Login time expired, please login again.");
        router.push('/');
      } else {
        response = await approveAppealPut(formData);
      }
    }
    if (!response.ok) {
      const err = await response.json();
      alert(err.error);
    }
    if (response.ok) {
      setAppeals(appeals.map(a => 
        a.id === appealId ? { ...a, status: 'approved' as const } : a
      ));
      alert('Appeal approved: ' + appealId);
    }

  };

   const rejectAppealPut = async (formData: any) => {
      const response = await fetch(`/api/admin/appeal/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      return await response;
  };

  const handleRejectAppeal = async (username: string, appealId: string) => {
    const formData = {
      username: username,
    }
   let response = await rejectAppealPut(formData);
    if (response.status === 401) {
      const refreshResponse = await refresh();
      if (refreshResponse.status === 401) {
        alert("Login time expired, please login again.");
        router.push('/');
      } else {
        response = await rejectAppealPut(formData);
      }
    }
    if (!response.ok) {
      const err = await response.json();
      alert(err.error);
    }
    if (response.ok) {
      setAppeals(appeals.map(a => 
        a.id === appealId ? { ...a, status: 'rejected' as const } : a
      ));
      alert('Appeal rejected: ' + appealId);
    }

  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const getToxicScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-red-600 dark:text-red-400';
    if (score >= 0.4) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getToxicScoreBadge = (score: number) => {
    if (score >= 0.7) return 'destructive';
    if (score >= 0.4) return 'default';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <p className="text-muted-foreground">Loading moderation panel...</p>
      </div>
    );
  }

  if (!currentUser?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50">
    {/* <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900"> */}
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/main')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forum
          </Button>
          
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl">Moderation Panel</h1>
              <p className="text-muted-foreground">Manage reports and appeals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="w-full justify-start mb-6">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Reports ({reports.filter(r => r.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="appeals" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Appeals ({appeals.filter(a => a.status === 'pending').length})
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No reports to review</p>
                </CardContent>
              </Card>
            ) : (
              reports.map(report => (
                <Card key={report.id} className={report.status !== 'pending' ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">
                            {report.reportedContent.type === 'thread' ? 'Thread' : 'Post'} Report
                          </CardTitle>
                          {report.status !== 'pending' && (
                            <Badge variant={report.status === 'accepted' ? 'default' : 'secondary'}>
                              {report.status === 'accepted' ? 'Accepted' : 'Rejected'}
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          Reported on {formatTimestamp(report.timestamp)}
                        </CardDescription>
                      </div>
                      <Badge variant={getToxicScoreBadge(report.toxicScore)}>
                        Toxic Score: {(report.toxicScore * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Reporter and Reported User */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Reported By</p>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={report.reportedBy.avatar} />
                            <AvatarFallback className="text-xs">
                              {getInitials(report.reportedBy.username)}
                            </AvatarFallback>
                          </Avatar>
                          <span 
                            className="font-medium cursor-pointer hover:underline"
                            onClick={() => router.push(`/user/${report.reportedBy.username}`)}
                          >
                            {report.reportedBy.username}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Reported User</p>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={report.reportedUser.avatar} />
                            <AvatarFallback className="text-xs">
                              {getInitials(report.reportedUser.username)}
                            </AvatarFallback>
                          </Avatar>
                          <span 
                            className="font-medium cursor-pointer hover:underline"
                            onClick={() => router.push(`/user/${report.reportedUser.username}`)}
                          >
                            {report.reportedUser.username}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reported Content */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border">
                      {report.reportedContent.title && (
                        <h4 className="font-semibold mb-2">{report.reportedContent.title}</h4>
                      )}
                      <p className="text-sm mb-2">{report.reportedContent.content}</p>
                      <p className="text-xs text-muted-foreground">
                        Posted on {formatTimestamp(report.reportedContent.timestamp)}
                      </p>
                    </div>

                    {/* Report Reason */}
                    <div>
                      <p className="text-sm font-semibold mb-1">Report Reason</p>
                      <p className="text-sm text-muted-foreground">{report.reason}</p>
                    </div>

                    {/* AI Verdict */}
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            AI Verdict
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {report.aiVerdict}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {report.status === 'pending' && (
                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => handleAcceptReport(report.id)}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Accept Report
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRejectReport(report.id)}
                          className="flex items-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject Report
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleAcceptAndBan(report)}
                          className="flex items-center gap-2"
                        >
                          <Ban className="h-4 w-4" />
                          Accept & Ban User
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Appeals Tab */}
          <TabsContent value="appeals" className="space-y-6">
            {appeals.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No appeals to review</p>
                </CardContent>
              </Card>
            ) : (
              appeals.map(appeal => (
                <Card key={appeal.id} className={appeal.status !== 'pending' ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">Ban Appeal</CardTitle>
                          {appeal.status !== 'pending' && (
                            <Badge variant={appeal.status === 'approved' ? 'default' : 'secondary'}>
                              {appeal.status === 'approved' ? 'Approved' : 'Rejected'}
                            </Badge>
                          )}
                        </div>
                        {/* <CardDescription>
                          Submitted on {formatTimestamp(appeal.timestamp)}
                        </CardDescription> */}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* User Info */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Appealing User</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={appeal.user.avatar} />
                          <AvatarFallback className="text-xs">
                            {getInitials(appeal.user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p 
                            className="font-medium cursor-pointer hover:underline"
                            onClick={() => router.push(`/user/${appeal.user.username}`)}
                          >
                            {appeal.user.username}
                          </p>
                          <p className="text-xs text-muted-foreground">{appeal.user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Ban Reason */}
                    {/* <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                        Original Ban Reason
                      </p>
                      {/* <p className="text-sm text-red-800 dark:text-red-200">{appeal.banReason}</p> */}
                    {/* </div> */} 

                    {/* Appeal Message */}
                    <div>
                      <p className="text-sm font-semibold mb-2">Appeal Message</p>
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border">
                        <p className="text-sm">{appeal.appealMessage}</p>
                      </div>
                    </div>

                    {/* Banned Post
                    <div>
                      <p className="text-sm font-semibold mb-2">Post That Led to Ban</p>
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border">
                        {appeal.bannedPost.title && (
                          <h4 className="font-semibold mb-2">{appeal.bannedPost.title}</h4>
                        )}
                        <p className="text-sm mb-2">{appeal.bannedPost.content}</p>
                        <p className="text-xs text-muted-foreground">
                          Posted on {formatTimestamp(appeal.bannedPost.timestamp)}
                        </p>
                      </div>
                    </div> */}

                    {/* Action Buttons */}
                    {appeal.status === 'pending' && (
                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          variant="default"
                          onClick={() => handleApproveAppeal(appeal.user.username, appeal.id)}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve Appeal (Unban User)
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRejectAppeal(appeal.user.username, appeal.id)}
                          className="flex items-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject Appeal
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Ban User Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle  className="text-slate-900 dark:text-slate-50">Ban User</DialogTitle>
            <DialogDescription  className="text-slate-900 dark:text-slate-50">
              You are about to ban {selectedReport?.reportedUser.username}. Please provide a reason for the ban.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="banReason">Ban Reason</Label>
              <Textarea
                id="banReason"
                placeholder="Enter the reason for this ban..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmBanUser}
              disabled={!banReason.trim()}
            >
              <Ban className="h-4 w-4 mr-2" />
              Confirm Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
