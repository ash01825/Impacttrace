import axios from "axios";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nvidia/nemotron-3-nano-30b-a3b:free";

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY not set in environment");
  }
  return key;
}

interface GenerateParams {
  maxTokens?: number;
  temperature?: number;
}

export async function generateText(
  prompt: string,
  params: GenerateParams = {}
): Promise<string> {
  const apiKey = getApiKey();
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        OPENROUTER_ENDPOINT,
        {
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: params.maxTokens ?? 4096,
          temperature: params.temperature ?? 0.1,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://impacttrace.dev",
            "X-Title": "ImpactTrace AI Engine",
          },
          timeout: 60000, // 60s timeout
        }
      );

      return response.data.choices?.[0]?.message?.content ?? "";
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      console.warn(`[aiClient] API error, retrying attempt ${attempt + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 1500 * attempt));
    }
  }
  
  return "";
}

export interface StreamCallback {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export async function generateTextStream(
  prompt: string,
  callback: StreamCallback,
  params: GenerateParams = {}
): Promise<void> {
  const apiKey = getApiKey();
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        OPENROUTER_ENDPOINT,
        {
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: params.maxTokens ?? 4096,
          temperature: params.temperature ?? 0.1,
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://impacttrace.dev",
            "X-Title": "ImpactTrace AI Engine",
          },
          responseType: "stream",
          timeout: 60000,
        }
      );

      let fullText = "";

      return new Promise<void>((resolve, reject) => {
        response.data.on("data", (chunk: Buffer) => {
          const lines = chunk.toString().split("\n").filter(Boolean);
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]") return;
              try {
                const data = JSON.parse(dataStr);
                const token = data.choices?.[0]?.delta?.content ?? "";
                if (token) {
                  fullText += token;
                  callback.onToken(token);
                }
              } catch {
                // Skip unparseable lines
              }
            }
          }
        });

        response.data.on("end", () => {
          callback.onComplete(fullText);
          resolve();
        });

        response.data.on("error", (err: Error) => {
          reject(err);
        });
      });
    } catch (err) {
      if (attempt === maxRetries) {
        callback.onError(err instanceof Error ? err : new Error(String(err)));
        return;
      }
      console.warn(`[aiClient stream] API error, retrying attempt ${attempt + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 1500 * attempt));
    }
  }
}
