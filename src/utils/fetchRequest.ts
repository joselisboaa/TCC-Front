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

export default async function fetchRequest<T, U>(endpoint: string, options: fetchRequestOptions<T> = {}): Promise<FetchResponse<U>> {
    const { body, headers: optionHeaders, method, isMiddleware, ...otherOptions } = options;
    const token = Cookies.get("jwt");
    const headers = new Headers(optionHeaders);
    headers.append("Authorization", `Bearer ${token}`);

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

        let responseBody = null;

        const contentType = response.headers.get("Content-Type");
        if (contentType?.includes("application/json")) {
            responseBody = await response.json();
        }

        if (!response.ok) {
            const errorMessage = responseBody?.message || "Erro desconhecido.";
            throw new Error(errorMessage);
        }

        return {
            statusCode: response.status,
            body: responseBody as U,
        };
    } catch (error) {
        throw new Error(`Ocorreu um erro na requisição: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
}
