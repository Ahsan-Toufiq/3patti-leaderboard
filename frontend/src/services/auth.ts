import api from './api';

export interface DeletionAuthResponse {
  success: boolean;
  data?: { token: string };
  error?: string;
  message?: string;
}

export interface PasswordResetResponse {
  success: boolean;
  data?: { 
    temporaryPassword?: string;
    note?: string;
  };
  error?: string;
  message?: string;
}

class AuthService {
  private deletionToken: string | null = null;
  private tokenExpiry: number | null = null;

  // Verify deletion password and get token
  async verifyDeletionPassword(password: string): Promise<DeletionAuthResponse> {
    try {
      const response = await api.post<DeletionAuthResponse>('/api/auth/verify-deletion', {
        password
      });
      
      if (response.data.success && response.data.data?.token) {
        this.deletionToken = response.data.data.token;
        // Token expires in 5 minutes
        this.tokenExpiry = Date.now() + (5 * 60 * 1000);
        
        // Store in sessionStorage for persistence across page reloads
        sessionStorage.setItem('deletion_token', this.deletionToken);
        sessionStorage.setItem('deletion_token_expiry', this.tokenExpiry.toString());
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Deletion password verification failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to verify password'
      };
    }
  }

  // Check if we have a valid deletion token
  async isDeleteAuthorized(): Promise<boolean> {
    // Check memory first
    if (this.deletionToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return true;
    }

    // Check sessionStorage
    const storedToken = sessionStorage.getItem('deletion_token');
    const storedExpiry = sessionStorage.getItem('deletion_token_expiry');

    if (storedToken && storedExpiry) {
      const expiry = parseInt(storedExpiry);
      if (Date.now() < expiry) {
        this.deletionToken = storedToken;
        this.tokenExpiry = expiry;
        
        // Validate token with server
        try {
          const response = await api.post('/api/auth/validate-token', {
            token: storedToken
          });
          
          if (response.data.success) {
            return true;
          }
        } catch (error) {
          console.error('Token validation failed:', error);
        }
      }
    }

    // Clear invalid token
    this.clearDeletionAuth();
    return false;
  }

  // Get current deletion token
  getDeletionToken(): string | null {
    return this.deletionToken;
  }

  // Clear deletion authorization
  clearDeletionAuth(): void {
    this.deletionToken = null;
    this.tokenExpiry = null;
    sessionStorage.removeItem('deletion_token');
    sessionStorage.removeItem('deletion_token_expiry');
  }

  // Request password reset
  async requestPasswordReset(): Promise<PasswordResetResponse> {
    try {
      const response = await api.post<PasswordResetResponse>('/api/auth/reset-password');
      return response.data;
    } catch (error: any) {
      console.error('Password reset request failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to request password reset'
      };
    }
  }

  // Get time remaining for current token (in seconds)
  getTokenTimeRemaining(): number {
    if (!this.tokenExpiry) return 0;
    const remaining = Math.max(0, this.tokenExpiry - Date.now());
    return Math.floor(remaining / 1000);
  }

  // Check if token is about to expire (less than 1 minute remaining)
  isTokenExpiringSoon(): boolean {
    const remaining = this.getTokenTimeRemaining();
    return remaining > 0 && remaining < 60;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService; 