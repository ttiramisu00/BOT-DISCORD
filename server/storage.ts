import { type User, type InsertUser, type JobCompletion, type InsertJobCompletion, type JobTaken, type InsertJobTaken, type Order, type InsertOrder, type ClientFeedback, type InsertClientFeedback, type BotStats, type InsertBotStats, type UserLevel, type InsertUserLevel } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createJobCompletion(jobCompletion: InsertJobCompletion): Promise<JobCompletion>;
  getRecentJobCompletions(limit?: number): Promise<JobCompletion[]>;
  getJobCompletionsToday(): Promise<number>;
  createJobTaken(jobTaken: InsertJobTaken): Promise<JobTaken>;
  updateJobTakenStatus(userId: string, status: string): Promise<void>;
  getJobTakenStats(): Promise<Array<{username: string, jobsTaken: number, jobsInProgress: number, jobsCompleted: number}>>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(orderId: string, status: string, artistId?: string, artistUsername?: string): Promise<Order | null>;
  getOrdersByStatus(status?: string): Promise<Order[]>;
  getOrdersByClient(clientId: string): Promise<Order[]>;
  getAllClients(): Promise<Array<{clientId: string, clientUsername: string, orderCount: number}>>;
  createClientFeedback(feedback: InsertClientFeedback): Promise<ClientFeedback>;
  getClientFeedback(limit?: number): Promise<ClientFeedback[]>;
  getBotStats(): Promise<BotStats | undefined>;
  updateBotStats(stats: Partial<InsertBotStats>): Promise<BotStats>;
  getTopUsers(limit?: number): Promise<Array<{username: string, jobCount: number, level: number}>>;
  getUserLevel(username: string): Promise<UserLevel | undefined>;
  updateUserLevel(username: string, totalJobs: number): Promise<{userLevel: UserLevel, leveledUp: boolean, newLevel?: number}>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private jobCompletions: Map<string, JobCompletion>;
  private jobTaken: Map<string, JobTaken>;
  private orders: Map<string, Order>;
  private clientFeedback: Map<string, ClientFeedback>;
  private botStats: BotStats | undefined;
  private userLevels: Map<string, UserLevel>;

  constructor() {
    this.users = new Map();
    this.jobCompletions = new Map();
    this.jobTaken = new Map();
    this.orders = new Map();
    this.clientFeedback = new Map();
    this.userLevels = new Map();
    
    // Initialize with default bot stats
    this.botStats = {
      id: randomUUID(),
      serverCount: 0,
      activeUsers: 0,
      streakChannels: 0,
      uptime: "99.8%",
      responseTime: "142ms",
      memoryUsage: "34.2 MB",
      lastRestart: new Date(),
      isOnline: false,
      updatedAt: new Date(),
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createJobCompletion(insertJobCompletion: InsertJobCompletion): Promise<JobCompletion> {
    const id = randomUUID();
    const jobCompletion: JobCompletion = {
      ...insertJobCompletion,
      id,
      completedAt: new Date(),
    };
    this.jobCompletions.set(id, jobCompletion);
    return jobCompletion;
  }

  async getRecentJobCompletions(limit: number = 10): Promise<JobCompletion[]> {
    const completions = Array.from(this.jobCompletions.values())
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
      .slice(0, limit);
    return completions;
  }

  async getJobCompletionsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.jobCompletions.values())
      .filter(completion => completion.completedAt >= today)
      .length;
  }

  async getBotStats(): Promise<BotStats | undefined> {
    return this.botStats;
  }

  async updateBotStats(stats: Partial<InsertBotStats>): Promise<BotStats> {
    if (!this.botStats) {
      this.botStats = {
        id: randomUUID(),
        serverCount: 0,
        activeUsers: 0,
        streakChannels: 0,
        uptime: "99.8%",
        responseTime: "142ms",
        memoryUsage: "34.2 MB",
        lastRestart: new Date(),
        isOnline: false,
        updatedAt: new Date(),
      };
    }

    this.botStats = {
      ...this.botStats,
      ...stats,
      updatedAt: new Date(),
    };

    return this.botStats;
  }

  async getTopUsers(limit: number = 4): Promise<Array<{username: string, jobCount: number, level: number}>> {
    const targetArtists = ['trms_u', 'noterooo', 'danzz0561', 'youknowfaiz_'];
    const userJobCounts = new Map<string, number>();
    
    // Initialize target artists with 0 jobs
    targetArtists.forEach(artist => {
      userJobCounts.set(artist, 0);
    });
    
    // Count jobs for each user
    Array.from(this.jobCompletions.values()).forEach(job => {
      const currentCount = userJobCounts.get(job.username) || 0;
      userJobCounts.set(job.username, currentCount + 1);
    });

    // Convert target artists to array and sort by job count (descending)
    const sortedUsers = targetArtists
      .map(username => {
        const jobCount = userJobCounts.get(username) || 0;
        const userLevel = this.userLevels.get(username);
        const level = userLevel ? userLevel.level : 1;
        return { username, jobCount, level };
      })
      .sort((a, b) => b.jobCount - a.jobCount);

    return sortedUsers;
  }

  async getUserLevel(username: string): Promise<UserLevel | undefined> {
    return this.userLevels.get(username);
  }

  async createJobTaken(insertJobTaken: InsertJobTaken): Promise<JobTaken> {
    const id = randomUUID();
    const jobTaken: JobTaken = {
      ...insertJobTaken,
      id,
      status: insertJobTaken.status || 'taken',
      takenAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobTaken.set(id, jobTaken);
    return jobTaken;
  }

  async updateJobTakenStatus(userId: string, status: string): Promise<void> {
    // Find the most recent job taken by this user
    const userJobTaken = Array.from(this.jobTaken.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime())[0];
    
    if (userJobTaken) {
      const updated: JobTaken = {
        ...userJobTaken,
        status,
        updatedAt: new Date(),
      };
      this.jobTaken.set(userJobTaken.id, updated);
    }
  }

  async getJobTakenStats(): Promise<Array<{username: string, jobsTaken: number, jobsInProgress: number, jobsCompleted: number}>> {
    const targetArtists = ['trms_u', 'noterooo', 'danzz0561', 'youknowfaiz_'];
    const stats = new Map<string, {jobsTaken: number, jobsInProgress: number, jobsCompleted: number}>();
    
    // Initialize target artists with 0 stats
    targetArtists.forEach(artist => {
      stats.set(artist, { jobsTaken: 0, jobsInProgress: 0, jobsCompleted: 0 });
    });
    
    // Count jobs by status for each user
    Array.from(this.jobTaken.values()).forEach(job => {
      const currentStats = stats.get(job.username) || { jobsTaken: 0, jobsInProgress: 0, jobsCompleted: 0 };
      
      if (job.status === 'taken') {
        currentStats.jobsTaken += 1;
      } else if (job.status === 'in_progress') {
        currentStats.jobsInProgress += 1;
      } else if (job.status === 'completed') {
        currentStats.jobsCompleted += 1;
      }
      
      stats.set(job.username, currentStats);
    });

    return Array.from(stats.entries()).map(([username, data]) => ({
      username,
      ...data
    }));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      id,
      status: insertOrder.status || 'waiting',
      deadline: insertOrder.deadline || null,
      price: insertOrder.price || null,
      artistId: insertOrder.artistId || null,
      artistUsername: insertOrder.artistUsername || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(orderId: string, status: string, artistId?: string, artistUsername?: string): Promise<Order | null> {
    const order = this.orders.get(orderId);
    if (!order) return null;

    const updated: Order = {
      ...order,
      status,
      artistId: artistId || order.artistId,
      artistUsername: artistUsername || order.artistUsername,
      updatedAt: new Date(),
    };
    this.orders.set(orderId, updated);
    return updated;
  }

  async getOrdersByStatus(status?: string): Promise<Order[]> {
    const allOrders = Array.from(this.orders.values());
    if (!status) return allOrders;
    return allOrders.filter(order => order.status === status);
  }

  async getOrdersByClient(clientId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.clientId === clientId);
  }

  async getAllClients(): Promise<Array<{clientId: string, clientUsername: string, orderCount: number}>> {
    const clientMap = new Map<string, {clientUsername: string, orderCount: number}>();
    
    Array.from(this.orders.values()).forEach(order => {
      const existing = clientMap.get(order.clientId);
      if (existing) {
        existing.orderCount++;
      } else {
        clientMap.set(order.clientId, {
          clientUsername: order.clientUsername,
          orderCount: 1
        });
      }
    });

    return Array.from(clientMap.entries()).map(([clientId, data]) => ({
      clientId,
      ...data
    }));
  }

  async createClientFeedback(insertFeedback: InsertClientFeedback): Promise<ClientFeedback> {
    const id = randomUUID();
    const feedback: ClientFeedback = {
      ...insertFeedback,
      id,
      rating: insertFeedback.rating ?? 5,
      createdAt: new Date(),
    };
    this.clientFeedback.set(id, feedback);
    return feedback;
  }

  async getClientFeedback(limit: number = 10): Promise<ClientFeedback[]> {
    return Array.from(this.clientFeedback.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async updateUserLevel(username: string, totalJobs: number): Promise<{userLevel: UserLevel, leveledUp: boolean, newLevel?: number}> {
    const currentLevel = this.userLevels.get(username);
    const newLevelNumber = Math.floor(totalJobs / 2) + 1;
    
    if (!currentLevel) {
      // Create new user level
      const userLevel: UserLevel = {
        id: randomUUID(),
        username,
        level: newLevelNumber,
        totalJobs,
        lastLevelUpAt: new Date(),
      };
      this.userLevels.set(username, userLevel);
      return { userLevel, leveledUp: newLevelNumber > 1, newLevel: newLevelNumber };
    }
    
    const leveledUp = newLevelNumber > currentLevel.level;
    const updatedLevel: UserLevel = {
      ...currentLevel,
      level: newLevelNumber,
      totalJobs,
      lastLevelUpAt: leveledUp ? new Date() : currentLevel.lastLevelUpAt,
    };
    
    this.userLevels.set(username, updatedLevel);
    return { 
      userLevel: updatedLevel, 
      leveledUp, 
      newLevel: leveledUp ? newLevelNumber : undefined 
    };
  }
}

export const storage = new MemStorage();
