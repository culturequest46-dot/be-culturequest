import { Express, Request, Response } from "express";
import { storage } from "../storage";

export function resource(app: Express) {
    app.post("/api/resource/create-resource", async (request: Request, response: Response) => {
        try {
            const { title, ...otherData } = request.body;
            const existingResource = await storage.getResourceDetail(title);
            if (existingResource) {
                response.status(400).json({ message: "Resource already exists" });
            } else {
                const newResource = await storage.createResource({ title, ...otherData });                
                response.status(201).json(newResource);
            }
        } catch (error) {
            response.status(400).json({ message: error instanceof Error ? error.message : "Failed to create a new resource" });
        }
    });

    app.get("/api/resource/get-all-resources", async (request: Request, response: Response) => {
        try {
            const resources = await storage.getResources();
            response.status(200).json(resources);
        } catch (error) {
            response.status(400).json({ message: error instanceof Error ? error.message : "Failed to get all recourses" });
        }
    });
}