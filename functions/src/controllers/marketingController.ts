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
    console.log(`[AI] Researching domain: ${domain}`);
    
    const prompt = `
      ROLE: You are a Corporate Intelligence Analyst for Flow Networks.
      TASK: Conduct a deep-dive strategic analysis of the company at domain: ${domain}.
      
      CONTEXT: Flow Networks provides "AI Gateways" for physical venues (WiFi authentication + AI services).
      
      OBJECTIVES:
      1. **Summary:** Describe what they do, focusing on their physical footprint (retail stores, hotels, stadiums, offices).
      2. **Tech Stack:** Infer their technology needs. Do they use heavy CRM (Salesforce)? Do they have guest WiFi? (Make educated inferences based on industry).
      3. **News:** Identify recent triggers (expansion, new leadership, digital transformation efforts).
      
      OUTPUT JSON SCHEMA: 
      { 
        "summary": "Concise, strategic overview...", 
        "techStack": [
            {"name": "Technology Name", "category": "CRM" | "WiFi" | "Marketing" | "Operations", "description": "Why this matters for Flow"}
        ], 
        "news": [
            {"title": "Headline", "url": "#", "published_date": "YYYY-MM-DD", "summary": "Brief context"}
        ] 
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

export const generateContent = async (req: Request, res: Response) => {
  try {
    const { prompt: userPrompt, type } = req.body;
    const prompt = `
      ROLE: You are the Chief Content Strategist for Flow Networks.
      TASK: Generate ${type} content based on this topic: "${userPrompt}".
      
      TONE: Innovative, authoritative, forward-thinking, and slightly witty (Gen X style).
      
      GUIDELINES:
      - Focus on the concept of "Physical Presence Verification" and "AI Gateways."
      - Avoid generic marketing fluff. Use strong verbs.
      - Format with Markdown (Bold headers, bullet points).
      
      OUTPUT: Return ONLY the content text.
    `;

    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash-lite-001', // Target Model
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
    
    const prompt = `
      ROLE: You are a B2B Lead Generation Specialist focused on the South African market.
      TASK: Generate a targeted list of 5 potential clients matching these criteria: "${criteria}".
      
      FILTER:
      - Prioritize companies with physical venues (Hotels, Malls, Retail Chains, Logistics).
      - These should be real or highly plausible companies operating in SA.
      
      OUTPUT JSON SCHEMA: 
      { 
        "leads": [
            { "company_name": "Name", "domain": "domain.co.za" }
        ] 
      }
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