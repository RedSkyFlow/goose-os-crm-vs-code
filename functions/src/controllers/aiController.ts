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


// HELPER: Robust JSON Extractor
const parseAIResponse = (text: string) => {
    try {
        return JSON.parse(text);
    } catch (e) {
        console.warn("JSON Parse Failed on raw text:", text);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("AI returned invalid data format: " + text.substring(0, 50));
    }
};

export const summarize = async (req: Request, res: Response) => {
    try {
        const { text } = req.body;
        if (!text || text.length < 5) {
            res.json({ summary: "No data available." });
            return;
        }
        const model = getAIModel();
        const prompt = `Summarize this strictly in 2 sentences: ${text}`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        res.json({ summary: response.text() });
    } catch (error: any) {
        console.error("AI Error (Summarize):", error);
        res.status(500).json({ error: error.message });
    }
};

export const generateProposal = async (req: Request, res: Response) => {
    try {
        const { deal, interactions } = req.body;
        const model = getAIModel();
        const prompt = `
      Act as a B2B Sales Pro. Generate a proposal JSON for this deal: ${deal.deal_name}.
      Context: ${JSON.stringify(interactions ? interactions.slice(0, 5) : [])}
      Output Schema: { "executiveSummary": "...", "solutionItems": [{"name": "...", "price": 0, "category": "..."}]} 
      Ensure valid JSON output only.
    `;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const data = parseAIResponse(response.text());
        res.json(data);
    } catch (error: any) {
        console.error("AI Error (Proposal):", error);
        res.status(500).json({ error: error.message });
    }
};

export const nextBestAction = async (req: Request, res: Response) => {
    try {
        const { deal } = req.body;
        const model = getAIModel();
        const prompt = `Based on this deal stage '${deal.stage}' and recent history, what is the ONE single next best action? Output JSON: { "action": "..." }`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const data = parseAIResponse(response.text());
        res.json(data);
    } catch (error: any) {
        console.error("AI Error (NextBestAction):", error);
        res.status(500).json({ error: error.message });
    }
};

export const draftEmail = async (req: Request, res: Response) => {
    try {
        const { suggestion, deal } = req.body;
        const model = getAIModel();
        const prompt = `Draft a short, professional email based on this suggestion: '${suggestion}' for deal '${deal.deal_name}'. Output JSON: { "subject": "...", "body": "..." }`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const data = parseAIResponse(response.text());
        res.json(data);
    } catch (error: any) {
        console.error("AI Error (DraftEmail):", error);
        res.status(500).json({ error: error.message });
    }
};

export const copilotResponse = async (req: Request, res: Response) => {
    try {
        const { prompt, deal, interactions } = req.body;
        const model = getAIModel();
        const aiPrompt = `
        You are 'Goose', a strategic business co-pilot.
        User Prompt: ${prompt}
        Deal Context: ${JSON.stringify(deal || {})}
        History: ${JSON.stringify(interactions || [])}
        Provide a helpful, concise response.
        Output JSON: { "response": "..." }
      `;
        const result = await model.generateContent(aiPrompt);
        const response = result.response;
        const data = parseAIResponse(response.text());
        res.json(data);
    } catch (error: any) {
        console.error("AI Error (CoPilot):", error);
        res.status(500).json({ error: error.message });
    }
};