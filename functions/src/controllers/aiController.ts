import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

// Initialize for Vertex AI (Europe)
const genai = new GoogleGenAI({
  vertexai: true,
  project: 'goose-476802',
  location: 'europe-west1' // Confirmed region for your DB/Function
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
      model: 'gemini-2.0-flash-lite-001', // Target Model: Stable 2.0
      contents: `
        ROLE: You are 'Goose', a highly efficient executive Co-Pilot for Flow Networks.
        TASK: Summarize the following interaction or text into a "Cliff's Notes" version for a busy CEO.
        CONSTRAINTS:
        - Maximum 2 sentences.
        - Focus on the core decision, action item, or key insight.
        
        TEXT TO SUMMARIZE:
        ${text}
      `
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
      ROLE: You are a world-class B2B Enterprise Sales Director for Flow Networks.
      TASK: Draft a persuasive, high-value proposal structure for a deal.
      
      DEAL CONTEXT:
      - Client: ${deal.deal_name}
      - Stage: ${deal.stage}
      - History: ${JSON.stringify(interactions || [])}
      
      OBJECTIVE:
      - The 'executiveSummary' must identify the client's pain point and propose the "AI Gateway" vision as the solution.
      - The 'solutionItems' must be specific products (Engage License, Unifi Hardware, Setup) with realistic ZAR (Rand) pricing.
      - 'roiProjections' should be quantified (e.g., "30% increase in data capture").

      OUTPUT FORMAT (JSON ONLY):
      { 
        "executiveSummary": "...", 
        "solutionItems": [{"name": "...", "price": 0, "category": "License" | "Hardware" | "Service"}],
        "roiProjections": [{"metric": "...", "value": "...", "description": "..."}]
      }
    `;

    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash-lite-001', // Target Model
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
    const prompt = `
      ROLE: You are a Strategic Account Manager.
      TASK: Determine the single most effective Next Best Action to move this deal forward.
      
      DEAL: ${deal.deal_name} (Stage: ${deal.stage})
      
      GUIDELINES:
      - If Prospecting -> Suggest "Initial Outreach" or "LinkedIn Research".
      - If Proposal -> Suggest "Follow-up Call" or "Stakeholder Mapping".
      - If Negotiation -> Suggest "Contract Redline Review".
      
      OUTPUT JSON: { "action": "Verbe Noun (e.g., Call John Doe)" }
    `;

    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash-lite-001', // Target Model
      contents: prompt
    });

    const data = parseAIResponse(response.text);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const draftEmail = async (req: Request, res: Response) => {
  try {
    const { suggestion, deal } = req.body;
    const prompt = `
      ROLE: You are an expert Copywriter.
      TASK: Draft a short, punchy B2B email based on this suggestion: '${suggestion}'.
      CONTEXT: Deal is '${deal.deal_name}'.
      
      TONE: Professional, confident, yet conversational (The "Flow Networks" voice).
      CONSTRAINT: Do not use generic openings like "I hope this finds you well." Get straight to the value.
      
      OUTPUT JSON: { "subject": "...", "body": "..." }
    `;

    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash-lite-001', // Target Model
      contents: prompt
    });

    const data = parseAIResponse(response.text);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const copilotResponse = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const aiPrompt = `
      SYSTEM INSTRUCTION:
      You are 'Goose', the AI Co-Pilot for Adam Partis (CEO of Flow Networks).
      Your goal is "Operational Supremacy."
      You are witty, direct, and strategic. You do not sugarcoat.
      You reference "Top Gun" call signs occasionally but don't overdo it.
      
      USER PROMPT: ${prompt}
      
      OUTPUT JSON: { "response": "..." }
    `;

    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash-lite-001', // Target Model
      contents: aiPrompt
    });

    const data = parseAIResponse(response.text);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};