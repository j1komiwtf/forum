import { 
  User, Session, InsertUser, UserRole, 
  Complaint, InsertComplaint,
  ComplaintMessage, InsertComplaintMessage 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { role?: UserRole }): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  updateUserRole(id: number, role: UserRole): Promise<User>;
  updateUserStatus(id: number, updates: Partial<User>): Promise<User>;
  verifyUser(id: number): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getStaffUsers(): Promise<User[]>;

  // Session methods
  createSession(userId: number): Promise<Session>;
  endSession(id: number): Promise<Session>;
  getUserSessions(userId: number): Promise<Session[]>;
  getActiveSessions(): Promise<Session[]>;
  getExpiredSessions(): Promise<Session[]>;

  // Complaint methods
  getComplaint(id: number): Promise<Complaint | undefined>;
  createComplaint(userId: number, complaint: InsertComplaint): Promise<Complaint>;
  assignComplaint(complaintId: number, staffId: number): Promise<Complaint>;
  resolveComplaint(complaintId: number): Promise<Complaint>;
  rejectComplaint(complaintId: number): Promise<Complaint>;
  getUserComplaints(userId: number): Promise<Complaint[]>;
  getAllComplaints(): Promise<Complaint[]>;
  getPendingComplaints(): Promise<Complaint[]>;

  // Complaint messages methods
  getComplaintMessages(complaintId: number): Promise<ComplaintMessage[]>;
  createComplaintMessage(message: {
    complaintId: number;
    userId: number;
    message: string;
    isSystemMessage?: boolean;
  }): Promise<ComplaintMessage>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<number, Session>;
  private complaints: Map<number, Complaint>;
  private complaintMessages: Map<number, ComplaintMessage>;
  private currentUserId: number;
  private currentSessionId: number;
  private currentComplaintId: number;
  private currentMessageId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.complaints = new Map();
    this.complaintMessages = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentComplaintId = 1;
    this.currentMessageId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    this.initialize();
  }

  private async initialize() {
    await this.createUser({
      username: "owner",
      password: await hashPassword("test"),
      role: UserRole.OWNER,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser & { role?: UserRole }): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      ...insertUser,
      role: insertUser.role || UserRole.USER,
      isPremium: false,
      isVerified: false,
      isBlocked: false,
      displayName: insertUser.displayName || null,
      avatarUrl: null,
      createdAt: new Date(),
      lastLoginAt: null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async verifyUser(id: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, isVerified: true };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserRole(id: number, role: UserRole): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, role };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStatus(id: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getStaffUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role !== UserRole.USER,
    );
  }

  // Session methods
  async createSession(userId: number): Promise<Session> {
    const id = this.currentSessionId++;
    const session: Session = {
      id,
      userId,
      startTime: new Date(),
      endTime: null,
      isActive: true,
    };
    this.sessions.set(id, session);
    return session;
  }

  async endSession(id: number): Promise<Session> {
    const session = this.sessions.get(id);
    if (!session) throw new Error("Session not found");
    const updatedSession = {
      ...session,
      endTime: new Date(),
      isActive: false,
    };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async getUserSessions(userId: number): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId,
    );
  }

  async getActiveSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(
      (session) => session.isActive,
    );
  }

  async getExpiredSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(
      (session) => !session.isActive,
    );
  }

  // Complaint methods
  async getComplaint(id: number): Promise<Complaint | undefined> {
    return this.complaints.get(id);
  }

  async createComplaint(userId: number, complaint: InsertComplaint): Promise<Complaint> {
    const id = this.currentComplaintId++;
    const newComplaint: Complaint = {
      id,
      userId,
      ...complaint,
      status: "PENDING",
      assignedToId: null,
      createdAt: new Date(),
      resolvedAt: null,
    };
    this.complaints.set(id, newComplaint);

    // Create system message about complaint creation
    await this.createComplaintMessage({
      complaintId: id,
      userId,
      message: "Ticket created",
      isSystemMessage: true,
    });

    return newComplaint;
  }

  async assignComplaint(complaintId: number, staffId: number): Promise<Complaint> {
    const complaint = this.complaints.get(complaintId);
    if (!complaint) throw new Error("Complaint not found");
    const updatedComplaint = {
      ...complaint,
      assignedToId: staffId,
      status: "IN_PROGRESS",
    };
    this.complaints.set(complaintId, updatedComplaint);

    // Create system message about assignment
    await this.createComplaintMessage({
      complaintId,
      userId: staffId,
      message: "Ticket assigned to staff",
      isSystemMessage: true,
    });

    return updatedComplaint;
  }

  async resolveComplaint(complaintId: number): Promise<Complaint> {
    const complaint = this.complaints.get(complaintId);
    if (!complaint) throw new Error("Complaint not found");
    const updatedComplaint = {
      ...complaint,
      status: "RESOLVED",
      resolvedAt: new Date(),
    };
    this.complaints.set(complaintId, updatedComplaint);

    // Create system message about resolution
    await this.createComplaintMessage({
      complaintId,
      userId: complaint.assignedToId!,
      message: "Ticket resolved",
      isSystemMessage: true,
    });

    return updatedComplaint;
  }

  async rejectComplaint(complaintId: number): Promise<Complaint> {
    const complaint = this.complaints.get(complaintId);
    if (!complaint) throw new Error("Complaint not found");
    const updatedComplaint = {
      ...complaint,
      status: "REJECTED",
      resolvedAt: new Date(),
    };
    this.complaints.set(complaintId, updatedComplaint);

    // Create system message about rejection
    await this.createComplaintMessage({
      complaintId,
      userId: complaint.assignedToId!,
      message: "Ticket rejected",
      isSystemMessage: true,
    });

    return updatedComplaint;
  }

  async getUserComplaints(userId: number): Promise<Complaint[]> {
    return Array.from(this.complaints.values()).filter(
      (complaint) => complaint.userId === userId || complaint.assignedToId === userId
    );
  }

  async getAllComplaints(): Promise<Complaint[]> {
    return Array.from(this.complaints.values());
  }

  async getPendingComplaints(): Promise<Complaint[]> {
    return Array.from(this.complaints.values()).filter(
      (complaint) => complaint.status === "PENDING"
    );
  }

  // Complaint messages methods
  async getComplaintMessages(complaintId: number): Promise<ComplaintMessage[]> {
    return Array.from(this.complaintMessages.values())
      .filter(msg => msg.complaintId === complaintId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createComplaintMessage(message: {
    complaintId: number;
    userId: number;
    message: string;
    isSystemMessage?: boolean;
  }): Promise<ComplaintMessage> {
    const id = this.currentMessageId++;
    const newMessage: ComplaintMessage = {
      id,
      ...message,
      isSystemMessage: message.isSystemMessage || false,
      createdAt: new Date(),
    };
    this.complaintMessages.set(id, newMessage);
    return newMessage;
  }
}

export const storage = new MemStorage();