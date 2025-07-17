import { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertUserSchema } from "../schema";
import { generateToken, verifyToken } from "../helper/jwt";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function auth(app: Express) {
    app.post("/api/auth/register", async (request: Request, response: Response) => {
        try {
            const { interestedMajors, ...otherData } = request.body;
            const userData = registerSchema.parse(otherData);
            const { confirmPassword, ...userToCreate } = userData;
            const newUserObj = { ...userToCreate, interestedMajors: interestedMajors || [] };
            
            // Check if user already exists
            const existingUser = await storage.getUserByEmail(userToCreate.email);
            if (existingUser) {
                response.status(400).json({ message: "User already exists" });
            } else {
                const user = await storage.createUser(newUserObj);
                const { password, ...userWithoutPassword } = user;
                
                response.status(201).json({ user: userWithoutPassword });
            }
        } catch (error) {
            response.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
        }
    });

    app.post("/api/auth/login", async (request: Request, response: Response) => {
        try {
            const { email, password } = loginSchema.parse(request.body);
            
            const user = await storage.getUserByEmail(email);
            if (!user || user.password !== password) {
                response.status(401).json({ message: "Invalid credentials" });
            } else {
                const { password: _, ...userWithoutPassword } = user;
                const token = generateToken({ email: user.email, password: user.password });
                response.json({ user: userWithoutPassword, accessToken: token });
            }
        } catch (error) {
            response.status(400).json({ message: error instanceof Error ? error.message : "Login failed" });
        }
    });

    app.delete("/api/auth/delete-account", async (request: Request, response: Response) => {
        try {
            const accessToken = request.headers['accesstoken'];
            const decodedToken = verifyToken(accessToken as string);
            const email = decodedToken.email;
            
            const user = await storage.getUserByEmail(email);
            
            if (!user) {
                response.status(404).json({ message: "User not found" });
            } else {
                await storage.deleteUser(user.email);
                response.status(200).send();
            }
        } catch (error) {
            response.status(500).json({ message: "Failed to delete account" });
        }
    })
}