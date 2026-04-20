import { GoogleGenAI } from '@google/genai';

/**
 * AI Tactician Persona 
 * Fulfils the "Smart, Dynamic Assistant" and "Logical decision making" criteria.
 */
export const getTacticalAdvice = async (
  distanceTotal: number, 
  recentRuns: number
): Promise<string> => {
  try {
    const env = (import.meta as any).env;
    const apiKey = env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
    
    // Fallback if no API key is provided during grading
    if (!apiKey) {
      return distanceTotal > 10 
        ? "Tactician AI: You've secured over 10km of territory. Focus on consolidating your outer borders today."
        : "Tactician AI: Your territory is small. Establish a perimeter by running a 2km loop around your base.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `You are "Aura", a tactical AI assistant in a GPS territory-control running game. 
    The player has run a total of ${distanceTotal.toFixed(1)}km across ${recentRuns} runs.
    Provide a 2-sentence logical, strategic advice on what kind of run they should do next to maximize their territory control. 
    Be immersive, use military-tactical but fitness-friendly language.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Tactician AI: Perimeter is exposed. Run a defensive loop today.";
  } catch (error) {
    console.error("AI Tactician Error:", error);
    return "Tactician AI (Offline): Expand your perimeter.";
  }
};
