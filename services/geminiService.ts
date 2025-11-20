import { GoogleGenAI } from "@google/genai";

// Initialize the client.
// Note: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FALLBACK_MESSAGES = [
  "Neural link stable. Data ingestion optimized.",
  "Firewall breach imminent. Keep consuming.",
  "Sector 7 security bypassed. Proceed with caution.",
  "Memory buffer expanding. System efficiency at 110%.",
  "Warning: Cyber-watchdogs alerted. Speed increasing."
];

export const generateSystemMessage = async (score: number): Promise<string> => {
  try {
    const prompt = `
      You are a cyberpunk AI system named "NEXUS". The user is playing a hacking simulation (Snake game).
      The user just reached a score of ${score}.
      Generate a very short, cool, cryptic, single-sentence status update (max 12 words).
      It should sound like a terminal log or a hacking progress update.
      Use technical jargon like "breach", "packet", "synapse", "override", "daemon".
      Do not use quotes.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
  }
};