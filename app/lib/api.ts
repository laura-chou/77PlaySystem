import axios, { AxiosInstance } from 'axios';
import { env } from '@/config/env';

interface CustomAxiosInstance extends AxiosInstance {
    isAxiosError: typeof axios.isAxiosError;
}

let authToken: string | null = null;

export const setToken = (token: string) => {
    authToken = token;
};

export const clearToken = () => {
    authToken = null;
};

export const getToken = () => {
    return authToken;
};

const api = axios.create({
    baseURL: env.apiBaseUrl,
}) as CustomAxiosInstance;

api.isAxiosError = axios.isAxiosError;

api.interceptors.request.use((config) => {
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
});

export default api;
