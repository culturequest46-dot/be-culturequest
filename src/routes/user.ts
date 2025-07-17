import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { verifyToken } from "../helper/jwt";

export function user(app: Express) {
    // Get user by email
    app.get("/api/user/detail", async (request: Request, response: Response) => {
      try {
        const accessToken = request.headers['accesstoken'];
        const decodedToken = verifyToken(accessToken as string);
        const email = decodedToken.email;
        
        const user = await storage.getUserByEmail(email);
      
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
}