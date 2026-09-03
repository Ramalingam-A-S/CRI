export interface ApiConfig {
  mode: 'mock' | 'real';
  baseUrl: string;
}

export const config: ApiConfig = {
  mode: (import.meta.env.VITE_API_MODE as 'mock' | 'real') || 'mock',
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
};

export const API_MODE = config.mode;
