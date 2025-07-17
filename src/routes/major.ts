import { Express, Request, Response } from "express";
import { storage } from "../storage";

export function major(app: Express) {
    app.post("/api/major/create-major", async (request: Request, response: Response) => {
        try {
            const { name } = request.body;
            
            // Check if major already exists
            const existingMajor = await storage.getMajor(name);
            if (existingMajor) {
                response.status(400).json({ message: "Major already exists" });
            } else {
                const major = await storage.createMajor({ name });                
                response.status(201).json({ ...major });
            }
        } catch (error) {
            response.status(400).json({ message: error instanceof Error ? error.message : "Failed to create a new major" });
        }
    });

    app.get("/api/major/get-all-majors", async (request: Request, response: Response) => {
        try {
            const majors = await storage.getAllMajors();
            response.status(200).json(majors);
        } catch (error) {
            response.status(400).json({ message: error instanceof Error ? error.message : "Failed to get all majors" });
        }
    });
}