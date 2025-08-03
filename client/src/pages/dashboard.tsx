import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Users, 
  Zap, 
  Clock, 
  Activity, 
  Settings, 
  FileText, 
  Download,
  Trash2,
  TestTube,
  RotateCcw,
  Star,
  Trophy
} from "lucide-react";
// Use a placeholder for the celebration image since asset import has path issues
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface BotStats {
  id: string;
  serverCount: number;
  activeUsers: number;
  streakChannels: number;
  uptime: string;
  responseTime: string;
  memoryUsage: string;
  lastRestart: string;
  isOnline: boolean;
  jobsToday: number;
}

interface JobCompletion {
  id: string;
  userId: string;
  username: string;
  serverId: string;
  serverName: string;
  channelId: string;
  channelName: string;
  completedAt: string;
}

interface TopUser {
  username: string;
  jobCount: number;
  level: number;
  jobsToNextLevel?: number;
  nextLevel?: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<BotStats>({
    queryKey: ["/api/bot/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentJobs, isLoading: jobsLoading } = useQuery<JobCompletion[]>({
    queryKey: ["/api/jobs/recent"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: topUsers, isLoading: topUsersLoading } = useQuery<TopUser[]>({
    queryKey: ["/api/users/top"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: userLevels, isLoading: levelsLoading } = useQuery<TopUser[]>({
    queryKey: ["/api/levels"],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Check for recent level ups
  const { data: recentLevelUps } = useQuery<{username: string, newLevel: number}[]>({
    queryKey: ["/api/recent-level-ups"],
    refetchInterval: 5000,
    enabled: false, // We'll enable this when we implement the endpoint
  });

  const restartBotMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/bot/restart");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bot Restarted",
        description: "Discord bot has been restarted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bot/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restart bot. Please try again.",
        variant: "destructive",
      });
    },
  });

  const testJobMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/bot/test");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Completed",
        description: "Test job completion has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bot/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/top"] });
      queryClient.invalidateQueries({ queryKey: ["/api/levels"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create test job completion.",
        variant: "destructive",
      });
    },
  });

  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/bot/clear-logs");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Logs Cleared",
        description: "All logs have been cleared successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/recent"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear logs. Please try again.",
        variant: "destructive",
      });
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/bot/export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bot-data.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Data Exported",
        description: "Bot data has been exported successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Job Bot</h1>
              <p className="text-sm text-muted-foreground">
                {stats?.isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <Button variant="default" className="w-full justify-start">
            <Activity className="w-5 h-5 mr-3" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <CheckCircle className="w-5 h-5 mr-3" />
            Job Tracking
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Users className="w-5 h-5 mr-3" />
            Users
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <FileText className="w-5 h-5 mr-3" />
            Logs
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-gray-600">Monitor your Discord job bot performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${stats?.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  Connected to {stats?.serverCount || 0} servers
                </span>
              </div>
              <Button 
                onClick={() => restartBotMutation.mutate()}
                disabled={restartBotMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {restartBotMutation.isPending ? "Restarting..." : "Restart Bot"}
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Level Up Celebration Banner */}
          {userLevels && userLevels.some(user => user.level > 1) && (
            <div className="mb-6 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-lg p-4 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/80 via-orange-400/80 to-red-400/80 backdrop-blur-sm"></div>
              <div className="relative z-10 flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-white/20 rounded-lg p-1 flex items-center justify-center text-3xl">
                    🎉
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Level Up Achievements!</span>
                  </h3>
                  <p className="text-white/90">
                    {userLevels.filter(user => user.level > 1).map(user => 
                      `${user.username} reached Level ${user.level}`
                    ).join(" • ")}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium">🎉 Congratulations! 🎉</p>
                    <p className="text-xs text-white/80">Keep up the amazing work!</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jobs Completed Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.jobsToday || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Streak Channels</CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.streakChannels || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <Clock className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.uptime || "0%"}</div>
              </CardContent>
            </Card>
          </div>

          {/* Level System Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🎯</span>
                  <span>Level System</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {levelsLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 animate-pulse">
                        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-300 rounded w-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userLevels && userLevels.length > 0 ? (
                      userLevels.slice(0, 4).map((user) => {
                        const progressPercent = ((user.jobCount % 10) / 10) * 100;
                        
                        return (
                          <div key={user.username} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {user.level}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{user.username}</p>
                                  <p className="text-xs text-gray-500">Level {user.level} • {user.jobCount} total jobs</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-600">
                                  {user.jobsToNextLevel || (10 - (user.jobCount % 10))} to next level
                                </p>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🎯</div>
                        <p className="text-gray-500">No level data yet</p>
                        <p className="text-sm text-gray-400">Users will level up after completing 10 jobs</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>✨</span>
                  <span>Level System Rules</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Jobs per Level</p>
                      <p className="text-sm text-gray-600">Complete 1 job to gain 1 level</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl">🎉</div>
                    <div>
                      <p className="font-medium text-gray-900">Level Up Celebration</p>
                      <p className="text-sm text-gray-600">Automatic celebration effects in Discord when leveling up</p>
                      <div className="mt-2 bg-white rounded-lg p-2 border border-purple-200">
                        <div className="w-full h-24 flex items-center justify-center text-6xl">
                          🎉✨🎊
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl">🏆</div>
                    <div>
                      <p className="font-medium text-gray-900">Leaderboard Ranking</p>
                      <p className="text-sm text-gray-600">Levels are displayed on the artist leaderboard</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Job Completions</CardTitle>
                </CardHeader>
                <CardContent>
                  {jobsLoading ? (
                    <div className="space-y-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg animate-pulse">
                          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-300 rounded w-16"></div>
                            <div className="h-3 bg-gray-300 rounded w-20"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentJobs && recentJobs.length > 0 ? (
                        recentJobs.map((job) => (
                          <div key={job.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{job.username}</p>
                              <p className="text-sm text-gray-600">Server: {job.serverName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatDistanceToNow(new Date(job.completedAt), { addSuffix: true })}
                              </p>
                              <p className="text-xs text-gray-500">#{job.channelName}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No job completions yet</p>
                          <p className="text-sm text-gray-400">Job completions will appear here when users interact with the bot</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Bot Status */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full"
                    onClick={() => testJobMutation.mutate()}
                    disabled={testJobMutation.isPending}
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {testJobMutation.isPending ? "Testing..." : "Test !job Command"}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => clearLogsMutation.mutate()}
                    disabled={clearLogsMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {clearLogsMutation.isPending ? "Clearing..." : "Clear Logs"}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => exportDataMutation.mutate()}
                    disabled={exportDataMutation.isPending}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exportDataMutation.isPending ? "Exporting..." : "Export Data"}
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:from-yellow-100 hover:to-orange-100"
                    onClick={() => {
                      // Create 1 test completion to trigger level up
                      testJobMutation.mutate();
                    }}
                    disabled={testJobMutation.isPending}
                  >
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    Simulate Level Up
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>🤖</span>
                    <span>Discord Commands</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="font-medium text-green-900">/job</div>
                      <div className="text-sm text-green-700">Complete a job with interactive button</div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="font-medium text-blue-900">/leaderboard</div>
                      <div className="text-sm text-blue-700">Display top 4 artists leaderboard</div>
                    </div>
                    
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="font-medium text-purple-900">/taken</div>
                      <div className="text-sm text-purple-700">Mark job as taken/completed by client</div>
                    </div>
                    
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="font-medium text-orange-900">/template</div>
                      <div className="text-sm text-orange-700">Show client form requirements template</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bot Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Status</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${stats?.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <Badge variant={stats?.isOnline ? "default" : "destructive"}>
                        {stats?.isOnline ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Response Time</span>
                    <span className="text-sm font-medium text-gray-900">{stats?.responseTime || "N/A"}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Memory Usage</span>
                    <span className="text-sm font-medium text-gray-900">{stats?.memoryUsage || "N/A"}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Last Restart</span>
                    <span className="text-sm font-medium text-gray-900">
                      {stats?.lastRestart ? formatDistanceToNow(new Date(stats.lastRestart), { addSuffix: true }) : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🏆 Top Artists Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  {topUsersLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3 animate-pulse">
                          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                          <div className="flex-1 space-y-1">
                            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topUsers && topUsers.length > 0 ? (
                        topUsers.map((user, index) => {
                          const getMedal = (position: number) => {
                            switch (position) {
                              case 0: return '🥇';
                              case 1: return '🥈';
                              case 2: return '🥉';
                              default: return '🏅';
                            }
                          };
                          
                          return (
                            <div key={user.username} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <div className="text-2xl">{getMedal(index)}</div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{user.username}</p>
                                <p className="text-sm text-gray-600">{user.jobCount} jobs • Level {user.level || 1}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">#{index + 1}</p>
                                <p className="text-xs text-gray-500">Lvl {user.level || 1}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-2">🏆</div>
                          <p className="text-gray-500">No leaderboard data yet</p>
                          <p className="text-sm text-gray-400">Users will appear here after completing jobs</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Command Demo */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Discord Bot Command Demo</CardTitle>
              <p className="text-sm text-muted-foreground">Preview how the !job command appears in Discord</p>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      U
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-400 font-semibold">user123</span>
                        <span className="text-gray-400 text-xs">Today at 2:30 PM</span>
                      </div>
                      <div className="text-white mt-1">!job</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-primary font-semibold">Job Bot</span>
                        <Badge variant="secondary" className="text-xs">BOT</Badge>
                        <span className="text-gray-400 text-xs">Today at 2:30 PM</span>
                      </div>
                      <div className="text-white mt-1 mb-2">Klik tombol jika kamu menyelesaikan 1 job:</div>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => testJobMutation.mutate()}
                        disabled={testJobMutation.isPending}
                      >
                        ✅ Job Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Command Behavior:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• User types <code className="bg-gray-200 px-1 rounded">!job</code> in any channel</li>
                  <li>• Bot responds with interactive button</li>
                  <li>• User clicks "Job Clear" button</li>
                  <li>• Bot sends private confirmation to user</li>
                  <li>• Bot announces completion in streak channel</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
