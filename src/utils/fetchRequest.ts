import Cookies from "js-cookie";

interface fetchRequestOptions<T> extends Omit<RequestInit, "body"> {
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
    options: fetchRequestOptions<T> = {}
  ): Promise<FetchResponse<U>> {
    const { body, headers: optionHeaders, method, isMiddleware, ...otherOptions } = options;
    const token = Cookies.get("jwt");
    const headers = new Headers(optionHeaders);
  
    if (token) {
      headers.append("Authorization", `Bearer ${token}`);
    }
  
    if (body) {
      headers.append("Content-Type", "application/json");
    }
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`, {
        method: method ?? "GET",
        body: body ? JSON.stringify(body) : null,
        headers,
        ...otherOptions,
      });
  
      const contentType = response.headers.get("Content-Type");
      let responseBody: any = null;
  
      if (contentType?.includes("application/json")) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text(); // Se não for JSON, captura como texto
      }
  
      if (!response.ok) {
        console.error(`Erro na requisição: ${response.status} - ${response.statusText}`);
        console.error(`Resposta do servidor:`, responseBody);
        throw new Error(responseBody?.message || `Erro ${response.status}: ${response.statusText}`);
      }
  
      return {
        statusCode: response.status,
        body: responseBody as U,
      };
    } catch (error) {
      console.error("Erro ao fazer requisição:", error);
      throw error;
    }
  }
  