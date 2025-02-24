import { User, InsertUser, Candidate, InsertCandidate } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getCandidates(): Promise<Candidate[]>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  deleteCandidate(id: number): Promise<void>;
  vote(userId: number, candidateId: number): Promise<void>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private candidates: Map<number, Candidate>;
  private currentUserId: number;
  private currentCandidateId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.candidates = new Map();
    this.currentUserId = 1;
    this.currentCandidateId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      votesRemaining: 3 
    };
    this.users.set(id, user);
    return user;
  }

  async getCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values());
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const id = this.currentCandidateId++;
    const candidate: Candidate = { ...insertCandidate, id, votes: 0 };
    this.candidates.set(id, candidate);
    return candidate;
  }

  async deleteCandidate(id: number): Promise<void> {
    this.candidates.delete(id);
  }

  async vote(userId: number, candidateId: number): Promise<void> {
    const user = this.users.get(userId);
    const candidate = this.candidates.get(candidateId);

    if (!user || !candidate) {
      throw new Error("User or candidate not found");
    }

    if (user.votesRemaining <= 0) {
      throw new Error("No votes remaining");
    }

    user.votesRemaining--;
    candidate.votes++;
    
    this.users.set(userId, user);
    this.candidates.set(candidateId, candidate);
  }
}

export const storage = new MemStorage();
