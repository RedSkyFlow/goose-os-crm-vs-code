import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

// Initialize for Vertex AI
const genai = new GoogleGenAI({
  vertexai: true,
  project: 'goose-476802',
  location: 'europe-west1'
});

// Robust JSON Parser
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

export const summarize = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) { res.json({ summary: "" }); return; }

    const response = await genai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Summarize this strictly in 2 sentences: ${text}`
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const generateProposal = async (req: Request, res: Response) => {
  try {
    const { deal, interactions } = req.body;
    const prompt = `
      Act as a B2B Sales Pro. Generate a proposal JSON for this deal: ${deal.deal_name}.
      Context: ${JSON.stringify(interactions || [])}
      Output Schema: { "executiveSummary": "...", "solutionItems": [{"name": "...", "price": 0, "category": "..."}] }
      Ensure valid JSON output only.
    `;

    const response = await genai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });

    const data = parseAIResponse(response.text);
    res.json(data);
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const nextBestAction = async (req: Request, res: Response) => {
  try {
    const { deal } = req.body;
    const prompt = `Based on this deal stage '${deal.stage}', what is the ONE next best action? Output JSON: { "action": "..." }`;

    const response = await genai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });

    const data = parseAIResponse(response.text);
    res.json(data);
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const draftEmail = async (req: Request, res: Response) => {
  try {
    const { suggestion, deal } = req.body;
    const prompt = `Draft a short email based on: '${suggestion}' for deal '${deal.deal_name}'. Output JSON: { "subject": "...", "body": "..." }`;

    const response = await genai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });

    const data = parseAIResponse(response.text);
    res.json(data);
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const copilotResponse = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const aiPrompt = `You are Goose. User Prompt: ${prompt}. Output JSON: { "response": "..." }`;

    const response = await genai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: aiPrompt
    });

    const data = parseAIResponse(response.text);
    res.json(data);
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message });
  }
};