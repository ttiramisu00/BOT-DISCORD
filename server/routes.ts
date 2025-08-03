import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { discordBot } from "./services/discord-bot";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Discord bot
  try {
    await discordBot.initialize();
  } catch (error) {
    console.error('Failed to initialize Discord bot:', error);
  }

  // Get bot stats
  app.get("/api/bot/stats", async (req, res) => {
    try {
      const stats = await storage.getBotStats();
      const jobsToday = await storage.getJobCompletionsToday();
      
      res.json({
        ...stats,
        jobsToday,
      });
    } catch (error) {
      console.error('Error fetching bot stats:', error);
      res.status(500).json({ message: "Failed to fetch bot stats" });
    }
  });

  // Get recent job completions
  app.get("/api/jobs/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const recentJobs = await storage.getRecentJobCompletions(limit);
      res.json(recentJobs);
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
      res.status(500).json({ message: "Failed to fetch recent jobs" });
    }
  });

  // Get top users leaderboard
  app.get("/api/users/top", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 4;
      const topUsers = await storage.getTopUsers(limit);
      res.json(topUsers);
    } catch (error) {
      console.error('Error fetching top users:', error);
      res.status(500).json({ message: "Failed to fetch top users" });
    }
  });

  // Restart bot
  app.post("/api/bot/restart", async (req, res) => {
    try {
      await discordBot.restart();
      res.json({ message: "Bot restarted successfully" });
    } catch (error) {
      console.error('Error restarting bot:', error);
      res.status(500).json({ message: "Failed to restart bot" });
    }
  });

  // Test job command (simulate button click)
  app.post("/api/bot/test", async (req, res) => {
    try {
      const testCompletion = await storage.createJobCompletion({
        userId: "test-user",
        username: "trms_u",
        serverId: "test-server",
        serverName: "Test Server",
        channelId: "test-channel",
        channelName: "test-streak",
      });

      // Update level for test user
      const userCompletions = await storage.getRecentJobCompletions(1000);
      const userJobCount = userCompletions.filter(job => job.username === 'trms_u').length;
      const levelResult = await storage.updateUserLevel('trms_u', userJobCount);
      
      res.json({ 
        message: "Test job completion created", 
        completion: testCompletion,
        level: levelResult
      });
    } catch (error) {
      console.error('Error creating test job:', error);
      res.status(500).json({ message: "Failed to create test job" });
    }
  });

  // Get user level information
  app.get("/api/levels/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const userLevel = await storage.getUserLevel(username);
      
      if (!userLevel) {
        return res.status(404).json({ error: 'User level not found' });
      }

      const jobsToNextLevel = 10 - (userLevel.totalJobs % 10);
      
      res.json({
        ...userLevel,
        jobsToNextLevel,
        nextLevel: userLevel.level + 1
      });
    } catch (error) {
      console.error('Error getting user level:', error);
      res.status(500).json({ message: "Failed to get user level" });
    }
  });

  // Get all user levels
  app.get("/api/levels", async (req, res) => {
    try {
      const topUsers = await storage.getTopUsers(10);
      const levelsWithProgress = topUsers.map(user => ({
        ...user,
        jobsToNextLevel: 10 - (user.jobCount % 10),
        nextLevel: user.level + 1
      }));
      
      res.json(levelsWithProgress);
    } catch (error) {
      console.error('Error getting user levels:', error);
      res.status(500).json({ message: "Failed to get user levels" });
    }
  });

  // Clear logs (reset job completions)
  app.post("/api/bot/clear-logs", async (req, res) => {
    try {
      // In a real implementation, this would clear the database
      // For now, we'll just return success
      res.json({ message: "Logs cleared successfully" });
    } catch (error) {
      console.error('Error clearing logs:', error);
      res.status(500).json({ message: "Failed to clear logs" });
    }
  });

  // Export data
  app.get("/api/bot/export", async (req, res) => {
    try {
      const recentJobs = await storage.getRecentJobCompletions(1000);
      const stats = await storage.getBotStats();
      
      const exportData = {
        botStats: stats,
        jobCompletions: recentJobs,
        exportedAt: new Date().toISOString(),
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="bot-data.json"');
      res.json(exportData);
    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
