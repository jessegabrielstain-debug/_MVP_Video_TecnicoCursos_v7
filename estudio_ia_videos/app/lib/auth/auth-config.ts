/**
 * Auth Configuration
 * Configuração de autenticação e autorização
 */

export interface AuthConfig {
  sessionTimeout: number;
  tokenExpiry: number;
  refreshTokenExpiry: number;
}

export const authConfig: AuthConfig = {
  sessionTimeout: 3600000, // 1 hora
  tokenExpiry: 3600, // 1 hora em segundos
  refreshTokenExpiry: 604800, // 7 dias em segundos
};

export const AUTH_COOKIE_NAME = 'auth-token';
export const REFRESH_COOKIE_NAME = 'refresh-token';
