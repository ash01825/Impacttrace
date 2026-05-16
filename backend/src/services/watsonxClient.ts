import axios from "axios";

const IAM_TOKEN_URL = "https://iam.cloud.ibm.com/identity/token";
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

// IAM token cache with automatic refresh before expiry
interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  const apiKey = process.env.WATSONX_API_KEY;
  if (!apiKey) {
    throw new Error("WATSONX_API_KEY not set in environment");
  }

  const params = new URLSearchParams();
  params.append("grant_type", "urn:ibm:params:oauth:grant-type:apikey");
  params.append("apikey", apiKey);

  const response = await axios.post(IAM_TOKEN_URL, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const { access_token, expires_in } = response.data;

  tokenCache = {
    accessToken: access_token,
    expiresAt: Date.now() + expires_in * 1000 - TOKEN_EXPIRY_BUFFER_MS,
  };

  return access_token;
}

interface GenerateParams {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
}

export async function generateText(
  prompt: string,
  params: GenerateParams = {}
): Promise<string> {
  const endpoint = process.env.WATSONX_ENDPOINT;
  const projectId = process.env.WATSONX_PROJECT_ID;

  if (!endpoint || !projectId) {
    throw new Error("WATSONX_ENDPOINT or WATSONX_PROJECT_ID not set");
  }

  const accessToken = await getAccessToken();

  const requestBody = {
    model_id: "ibm/granite-3-8b-instruct",
    project_id: projectId,
    input: prompt,
    parameters: {
      max_new_tokens: params.maxTokens ?? 2048,
      temperature: params.temperature ?? 0.1,
      top_p: params.topP ?? 0.95,
      stop_sequences: params.stopSequences ?? [],
    },
  };

  const response = await axios.post(
    `${endpoint}/ml/v1/text/generation?version=2023-05-29`,
    requestBody,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.results?.[0]?.generated_text ?? "";
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
  const endpoint = process.env.WATSONX_ENDPOINT;
  const projectId = process.env.WATSONX_PROJECT_ID;

  if (!endpoint || !projectId) {
    callback.onError(new Error("WATSONX_ENDPOINT or WATSONX_PROJECT_ID not set"));
    return;
  }

  try {
    const accessToken = await getAccessToken();

    const requestBody = {
      model_id: "ibm/granite-3-8b-instruct",
      project_id: projectId,
      input: prompt,
      parameters: {
        max_new_tokens: params.maxTokens ?? 2048,
        temperature: params.temperature ?? 0.1,
        top_p: params.topP ?? 0.95,
        stop_sequences: params.stopSequences ?? [],
      },
    };

    const response = await axios.post(
      `${endpoint}/ml/v1/text/generation_stream?version=2023-05-29`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        responseType: "stream",
      }
    );

    let fullText = "";

    response.data.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            const token = data.results?.[0]?.generated_text ?? "";
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
    });

    response.data.on("error", (err: Error) => {
      callback.onError(err);
    });
  } catch (err) {
    callback.onError(err instanceof Error ? err : new Error(String(err)));
  }
}
