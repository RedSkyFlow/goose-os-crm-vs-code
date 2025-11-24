import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

// HELPER: Initialize AI Model
const getAIModel = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("CRITICAL: GEMINI_API_KEY is missing from Environment Variables!");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};

const parseAIResponse = (text: string) => {
    try {
        return JSON.parse(text);
    } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("AI returned invalid data format.");
    }
};

export const researchProspect = async (req: Request, res: Response) => {
    try {
        const { domain } = req.query;
        console.log(`[AI] Researching domain: ${domain}`);

        const prompt = `
      Research the company at domain: ${domain}. 
      Provide a summary, key tech stack, and recent news. 
      Output JSON: { "summary": "...", "techStack": [{"name": "...", "category": "...", "description": "..."}], "news": [{"title": "...", "url": "#", "published_date": "2024-01-01", "summary": "..."}] }
    `;
        const result = await getAIModel().generateContent(prompt);
        const response = result.response;
        const data = parseAIResponse(response.text());
        res.json(data);
    } catch (error: any) {
        console.error("AI Error (Research):", error);
        res.status(500).json({ error: error.message });
    }
};

export const generateContent = async (req: Request, res: Response) => {
    try {
        const { prompt: userPrompt, type } = req.body;

        const prompt = `Generate ${type} content based on this prompt: ${userPrompt}. Return plain text suitable for the medium.`;
        const result = await getAIModel().generateContent(prompt);
        const response = result.response;
        res.json({ content: response.text() });
    } catch (error: any) {
        console.error("AI Error (GenerateContent):", error);
        res.status(500).json({ error: error.message });
    }
};

export const generateLeadList = async (req: Request, res: Response) => {
    try {
        const { criteria } = req.body;

        const prompt = `Generate a mock lead list based on criteria: ${criteria}. Output JSON: { "leads": [{ "company_name": "...", "domain": "..." }] }`;
        const result = await getAIModel().generateContent(prompt);
        const response = result.response;
        const data = parseAIResponse(response.text());
        res.json(data);
    } catch (error: any) {
        console.error("AI Error (Leads):", error);
        res.status(500).json({ error: error.message });
    }
};