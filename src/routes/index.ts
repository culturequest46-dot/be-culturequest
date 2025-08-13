import { Express, Request, Response } from "express";
import { createServer } from "http";
import { storage } from "../storage";
import { insertResumeSchema, insertFeedbackSchema, insertDeadlineSchema, insertForumPostSchema, insertForumReplySchema } from "../schema";
import { auth } from "./auth";
import { user } from "./user";
import { major } from "./major";
import { resource } from "./resource";
import gradeLevel from "./gradeLevel";

export function registerRoutes(app: Express) {
  auth(app);
  user(app);
  major(app);
  resource(app);
  gradeLevel(app);

  // User routes
  app.get("/api/users/:id", async (request: Request, response: Response) => {
    try {
      const id = parseInt(request.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        response.status(404).json({ message: "User not found" });
      } else {
        const { password, ...userWithoutPassword } = user;
        response.json(userWithoutPassword);
      }
    } catch (error) {
      response.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", async (request: Request, response: Response) => {
    try {
      const id = parseInt(request.params.id);
      const updateData = request.body;
      
      const user = await storage.updateUser(id, updateData);
      if (!user) {
        response.status(404).json({ message: "User not found" });
      } else {
        const { password, ...userWithoutPassword } = user;
        response.json(userWithoutPassword);
      }
    } catch (error) {
      response.status(500).json({ message: "Failed to update user" });
    }
  });

  // Resume routes
  app.get("/api/resumes/:userId", async (request: Request, response: Response) => {
    try {
      const userId = parseInt(request.params.userId);
      const resume = await storage.getResume(userId);
      
      if (!resume) {
        response.status(404).json({ message: "Resume not found" });
      } else {
        response.json(resume);
      }
    } catch (error) {
      response.status(500).json({ message: "Failed to fetch resume" });
    }
  });

  app.post("/api/resumes", async (request: Request, response: Response) => {
    try {
      const resumeData = insertResumeSchema.parse(request.body);
      const resume = await storage.createResume(resumeData);
      response.status(201).json(resume);
    } catch (error) {
      response.status(400).json({ message: error instanceof Error ? error.message : "Failed to create resume" });
    }
  });

  app.put("/api/resumes/:userId", async (request: Request, response: Response) => {
    try {
      const userId = parseInt(request.params.userId);
      const updateData = request.body;
      
      const resume = await storage.updateResume(userId, updateData);
      if (!resume) {
        response.status(404).json({ message: "Resume not found" });
      } else {
        response.json(resume);
      }
    } catch (error) {
      response.status(500).json({ message: "Failed to update resume" });
    }
  });

  // College routes
  app.get("/api/colleges", async (request: Request, response: Response) => {
    try {
      const limit = request.query.limit ? parseInt(request.query.limit as string) : undefined;
      const search = request.query.search as string;
      console.log(search)
      const colleges = await storage.getColleges(limit, search);
      response.json(colleges);
    } catch (error) {
      response.status(500).json({ message: "Failed to fetch colleges" });
    }
  });

  app.get("/api/colleges/:id", async (request: Request, response: Response) => {
    try {
      const id = parseInt(request.params.id);
      const college = await storage.getCollege(id);
      
      if (!college) {
        response.status(404).json({ message: "College not found" });
      } else {
        response.json(college);
      }
    } catch (error) {
      response.status(500).json({ message: "Failed to fetch college" });
    }
  });

  // User college routes
  app.get("/api/users/:userId/colleges", async (request: Request, response: Response) => {
    try {
      const userId = parseInt(request.params.userId);
      const userColleges = await storage.getUserColleges(userId);
      response.json(userColleges);
    } catch (error) {
      response.status(500).json({ message: "Failed to fetch user colleges" });
    }
  });

  app.post("/api/users/:userId/colleges", async (request: Request, response: Response) => {
    try {
      const userId = parseInt(request.params.userId);
      const { collegeId, ...otherData } = request.body;
      
      const userCollege = await storage.addUserCollege({
        userId,
        collegeId,
        ...otherData
      });
      
      response.status(201).json(userCollege);
    } catch (error) {
      response.status(400).json({ message: "Failed to add college" });
    }
  });

  app.delete("/api/users/:userId/colleges/:collegeId", async (request: Request, response: Response) => {
    try {
      const userId = parseInt(request.params.userId);
      const collegeId = parseInt(request.params.collegeId);
      
      const success = await storage.removeUserCollege(userId, collegeId);
      if (!success) {
        response.status(404).json({ message: "College not found in user's list" });
      } else {
        response.status(204).send();
      }
    } catch (error) {
      response.status(500).json({ message: "Failed to remove college" });
    }
  });

  // Feedback routes
  app.get("/api/users/:userId/feedback", async (request: Request, response: Response) => {
    try {
      const userId = parseInt(request.params.userId);
      const feedback = await storage.getFeedbackForUser(userId);
      response.json(feedback);
    } catch (error) {
      response.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.post("/api/feedback", async (request: Request, response: Response) => {
    try {
      const feedbackData = insertFeedbackSchema.parse(request.body);
      const feedback = await storage.createFeedback(feedbackData);
      response.status(201).json(feedback);
    } catch (error) {
      response.status(400).json({ message: error instanceof Error ? error.message : "Failed to create feedback" });
    }
  });

  // Deadline routes
  app.get("/api/users/:userId/deadlines", async (request: Request, response: Response) => {
    try {
      const userId = parseInt(request.params.userId);
      const deadlines = await storage.getDeadlines(userId);
      response.json(deadlines);
    } catch (error) {
      response.status(500).json({ message: "Failed to fetch deadlines" });
    }
  });

  app.post("/api/deadlines", async (request: Request, response: Response) => {
    try {
      const deadlineData = insertDeadlineSchema.parse(request.body);
      const deadline = await storage.createDeadline(deadlineData);
      response.status(201).json(deadline);
    } catch (error) {
      response.status(400).json({ message: error instanceof Error ? error.message : "Failed to create deadline" });
    }
  });

  app.put("/api/deadlines/:id", async (request: Request, response: Response) => {
    try {
      const id = parseInt(request.params.id);
      const updateData = request.body;
      
      const deadline = await storage.updateDeadline(id, updateData);
      if (!deadline) {
        response.status(404).json({ message: "Deadline not found" });
      } else {
        response.json(deadline);
      }
    } catch (error) {
      response.status(500).json({ message: "Failed to update deadline" });
    }
  });

  // Forum routes
  app.get("/api/forum/posts", async (request: Request, response: Response) => {
    try {
      const category = request.query.category as string;
      const limit = request.query.limit ? parseInt(request.query.limit as string) : undefined;
      
      const posts = await storage.getForumPosts(category, limit);
      response.json(posts);
    } catch (error) {
      response.status(500).json({ message: "Failed to fetch forum posts" });
    }
  });

  app.get("/api/forum/posts/:id", async (request: Request, response: Response) => {
    try {
      const id = parseInt(request.params.id);
      const post = await storage.getForumPost(id);
      
      if (!post) {
        response.status(404).json({ message: "Post not found" });
      } else {
        response.json(post);
      }
    } catch (error) {
      response.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post("/api/forum/posts", async (request: Request, response: Response) => {
    try {
      const postData = insertForumPostSchema.parse(request.body);
      const post = await storage.createForumPost(postData);
      response.status(201).json(post);
    } catch (error) {
      response.status(400).json({ message: error instanceof Error ? error.message : "Failed to create post" });
    }
  });

  app.post("/api/forum/posts/:id/replies", async (request: Request, response: Response) => {
    try {
      const postId = parseInt(request.params.id);
      const replyData = insertForumReplySchema.parse({ ...request.body, postId });
      const reply = await storage.createForumReply(replyData);
      response.status(201).json(reply);
    } catch (error) {
      response.status(400).json({ message: error instanceof Error ? error.message : "Failed to create reply" });
    }
  });

  // Documents routes
  app.get("/api/users/:userId/documents", async (request: Request, response: Response) => {
    try {
      const userId = parseInt(request.params.userId);
      const documents = await storage.getUserDocuments(userId);
      response.json(documents);
    } catch (error) {
      response.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
