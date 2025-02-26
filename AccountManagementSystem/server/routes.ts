import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, comparePasswords } from "./auth";
import { storage } from "./storage";
import { UserRole } from "@shared/schema";
import {hashPassword} from './auth';
import { WebSocketServer } from 'ws';
import * as WebSocket from 'ws';
import session from 'express-session';
// Assuming sessionSettings is defined elsewhere
const sessionSettings = {/* ... your session settings ... */};


function isAdmin(req: Express.Request) {
  return req.user?.role === UserRole.OWNER || req.user?.role === UserRole.ADMIN;
}

function isOwner(req: Express.Request) {
  return req.user?.role === UserRole.OWNER;
}

function isStaff(req: Express.Request) {
  const staffRoles = [UserRole.OWNER, UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPPORT];
  return req.user && staffRoles.includes(req.user.role as UserRole);
}

// Проверка, может ли пользователь изменять статус целевого пользователя
async function canModifyUser(req: Express.Request, targetUserId: number) {
  const targetUser = await storage.getUser(targetUserId);
  if (!targetUser) return false;

  // Владелец может изменять всех
  if (req.user?.role === UserRole.OWNER) return true;

  // Администратор может изменять всех, кроме владельца
  if (req.user?.role === UserRole.ADMIN) {
    return targetUser.role !== UserRole.OWNER;
  }

  return false;
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // User management routes
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isAdmin(req)) return res.sendStatus(403);

    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.get("/api/users/staff", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isAdmin(req)) return res.sendStatus(403);

    const staff = await storage.getStaffUsers();
    res.json(staff);
  });

  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isOwner(req)) return res.sendStatus(403);

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });
    res.status(201).json(user);
  });

  app.patch("/api/users/:id/role", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isOwner(req)) return res.sendStatus(403);

    const targetId = parseInt(req.params.id);
    if (!await canModifyUser(req, targetId)) {
      return res.sendStatus(403);
    }

    const { role } = req.body;
    const user = await storage.updateUserRole(targetId, role);
    res.json(user);
  });

  app.patch("/api/users/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isAdmin(req)) return res.sendStatus(403);

    const targetId = parseInt(req.params.id);
    if (!await canModifyUser(req, targetId)) {
      return res.sendStatus(403);
    }

    const user = await storage.updateUserStatus(targetId, req.body);
    res.json(user);
  });

  app.patch("/api/users/:id/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isAdmin(req)) return res.sendStatus(403);

    const targetId = parseInt(req.params.id);
    if (!await canModifyUser(req, targetId)) {
      return res.sendStatus(403);
    }

    const user = await storage.verifyUser(targetId);
    res.json(user);
  });

  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isOwner(req)) return res.sendStatus(403);

    await storage.deleteUser(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // Profile management routes
  app.patch("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const user = await storage.updateUser(req.user!.id, req.body);
    res.json(user);
  });

  app.patch("/api/user/password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { currentPassword, newPassword } = req.body;
    const user = await storage.getUser(req.user!.id);

    if (!user || !(await comparePasswords(currentPassword, user.password))) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const updatedUser = await storage.updateUser(req.user!.id, {
      password: await hashPassword(newPassword),
    });
    res.json(updatedUser);
  });

  // Session management routes
  app.get("/api/sessions/active", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const sessions = await storage.getActiveSessions();
    res.json(sessions);
  });

  app.get("/api/sessions/expired", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const sessions = await storage.getExpiredSessions();
    res.json(sessions);
  });

  app.get("/api/sessions/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const sessions = await storage.getUserSessions(req.user!.id);
    res.json(sessions);
  });

  // Complaint management routes
  app.post("/api/complaints", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const complaint = await storage.createComplaint(req.user!.id, req.body);
    res.status(201).json(complaint);
  });

  app.get("/api/complaints", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    if (isStaff(req)) {
      const complaints = await storage.getAllComplaints();
      res.json(complaints);
    } else {
      const complaints = await storage.getUserComplaints(req.user!.id);
      res.json(complaints);
    }
  });

  app.get("/api/complaints/pending", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isStaff(req)) return res.sendStatus(403);

    const complaints = await storage.getPendingComplaints();
    res.json(complaints);
  });

  app.get("/api/complaints/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const complaints = await storage.getUserComplaints(req.user!.id);
    res.json(complaints);
  });

  app.patch("/api/complaints/:id/assign", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isStaff(req)) return res.sendStatus(403);

    const complaint = await storage.assignComplaint(
      parseInt(req.params.id),
      req.user!.id
    );
    res.json(complaint);
  });

  app.patch("/api/complaints/:id/resolve", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isStaff(req)) return res.sendStatus(403);

    const complaint = await storage.resolveComplaint(parseInt(req.params.id));
    res.json(complaint);
  });

  const httpServer = createServer(app);

  // Создаем WebSocket сервер для чата в репортах
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/complaints' });

  wss.on('connection', (ws, req) => {
    // Проверяем авторизацию через сессию
    const sessionParser = session(sessionSettings);
    sessionParser(req, {} as any, () => {
      if (!req.session?.passport?.user) {
        ws.close();
        return;
      }

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          const { complaintId, text } = message;

          // Проверяем права доступа к репорту
          const complaint = await storage.getComplaint(complaintId);
          if (!complaint) {
            ws.send(JSON.stringify({ error: 'Complaint not found' }));
            return;
          }

          // Проверяем, может ли пользователь писать в этот чат
          const userId = req.session.passport.user;
          const user = await storage.getUser(userId);

          if (!user) {
            ws.send(JSON.stringify({ error: 'User not found' }));
            return;
          }

          if (complaint.userId !== userId && !isStaff(user.role)) {
            ws.send(JSON.stringify({ error: 'Access denied' }));
            return;
          }

          // Сохраняем сообщение
          const newMessage = await storage.createComplaintMessage({
            complaintId,
            userId,
            message: text,
          });

          // Отправляем сообщение всем подключенным к этому репорту
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(newMessage));
            }
          });
        } catch (error) {
          console.error('WebSocket error:', error);
          ws.send(JSON.stringify({ error: 'Internal server error' }));
        }
      });
    });
  });

  return httpServer;
}