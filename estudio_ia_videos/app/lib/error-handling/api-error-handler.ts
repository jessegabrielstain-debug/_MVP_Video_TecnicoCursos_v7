export class ApiError extends Error {
  constructor(public message: string, public statusCode: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = {
  handleError: (error: unknown) => {
    if (error instanceof ApiError) {
      return error;
    }
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new ApiError(message, 500);
  },
  request: async <T>(url: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new ApiError(`Request failed with status ${response.status}`, response.status);
    }
    return response.json();
  }
};
