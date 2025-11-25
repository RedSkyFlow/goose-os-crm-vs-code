import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({
  vertexai: true,
  project: 'goose-476802',
  location: 'europe-west1'
});

const parseAIResponse = (text: string | null | undefined) => {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("AI response was not valid JSON.");
  }
};

export const researchProspect = async (req: Request, res: Response) => {
  try {
    const { domain } = req.query;
    const prompt = `
      Research the company at domain: ${domain}.
      Output JSON: { "summary": "...", "techStack": [{"name": "...", "category": "...", "description": "..."}], "news": [{"title": "...", "url": "#", "published_date": "2024-01-01", "summary": "..."}] }
    `;

    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash-lite-001', // UPGRADED TO 2.0 STABLE
      contents: prompt
    });

    const data = parseAIResponse(response.text);
    res.json(data);
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const generateContent = async (req: Request, res: Response) => {
  try {
    const { prompt: userPrompt, type } = req.body;
    const prompt = `Generate ${type} content based on: ${userPrompt}. Return plain text.`;

    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash-lite-001', // UPGRADED
      contents: prompt
    });

    res.json({ content: response.text });
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const generateLeadList = async (req: Request, res: Response) => {
  try {
    const { criteria } = req.body;
    const prompt = `Generate mock leads for: ${criteria}. Output JSON: { "leads": [{ "company_name": "...", "domain": "..." }] }`;

    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash-lite-001', // UPGRADED
      contents: prompt
    });

    const data = parseAIResponse(response.text);
    res.json(data);
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message });
  }
};