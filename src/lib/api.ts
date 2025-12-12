// FastAPI Backend URL - defaults to localhost:8001 for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export class ApiClient {
  private static getAuthHeaders = async (): Promise<HeadersInit> => {
    const token = localStorage.getItem('auth_token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  };

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getAuthHeaders();

    // Map endpoints to FastAPI routes
    // /admin/* goes to /admin/*
    // /auth/* goes to /api/auth/*
    // /user/* goes to /api/user/*
    // /announcements goes to /api/announcements
    let fullUrl: string;
    if (endpoint.startsWith('/admin/')) {
      fullUrl = `${API_BASE_URL}${endpoint}`;
    } else {
      fullUrl = `${API_BASE_URL}/api${endpoint}`;
    }

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.detail || data.message || 'An error occurred',
          status: response.status,
        };
      }

      return data;
    } catch (error: any) {
      if (error.message && error.status) {
        throw error;
      }
      throw {
        message: error.message || 'Network error occurred',
        status: 500,
      };
    }
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  static async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

export const clearAuthToken = () => {
  localStorage.removeItem('auth_token');
};
