import Cookies from "js-cookie";

interface FetchRequestOptions<T> extends Omit<RequestInit, "body"> {
  body?: T;
  headers?: Record<string, string>;
  method?: "HEAD" | "GET" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";
  isMiddleware?: boolean;
}

interface FetchResponse<U> {
  statusCode: number;
  body: U;
}

export default async function fetchRequest<T, U>(
  endpoint: string,
  options: FetchRequestOptions<T> = {}
): Promise<FetchResponse<U>> {
  const { body, headers: optionHeaders = {}, method = "GET", ...otherOptions } = options;
  const token = Cookies.get("jwt");
  
  const headers = new Headers(optionHeaders);
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers,
      ...otherOptions,
    });
    
    const contentType = response.headers.get("Content-Type");
    let responseBody: any;

    if (contentType?.includes("application/json")) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }
    
    if (!response.ok) {
      console.error(`Erro ${response.status}: ${response.statusText}`, responseBody);
      throw new Error(responseBody?.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return { statusCode: response.status, body: responseBody as U };
  } catch (error) {
    console.error("Erro ao fazer requisição:", error);
    throw error;
  }
}
