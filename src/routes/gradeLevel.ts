import { Express, Request, Response } from "express";
import { storage } from "../storage";

export default function gradeLevel(app: Express) {
    // Create a new grade level
    app.post("/api/grade-level", async (request: Request, response: Response) => {
        try {
            const { name } = request.body;
            
            // Check if grade level already exists
            const existingGradeLevel = await storage.getGradeLevel(name);
            if (existingGradeLevel) {
                response.status(400).json({ message: "Grade Level already exists" });
            } else {
                const gradeLevel = await storage.createGradeLevel({ name });                
                response.status(201).json({ ...gradeLevel });
            }
        } catch (error) {
            response.status(400).json({ message: error instanceof Error ? error.message : "Failed to create a new grade level" });
        }
    });

    // Get all grade levels
    app.get("/api/grade-level", async (request: Request, response: Response) => {
        try {
            const gradeLevels = await storage.getAllGradeLevel();
            response.json(gradeLevels);
        } catch (error) {
            response.status(500).json({ message: "Failed to fetch colleges" });
        }
    });
};