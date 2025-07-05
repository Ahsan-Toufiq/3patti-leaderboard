import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface DeletionAuthResponse {
  authorized: boolean;
}

export interface DeletionStatus {
  hasPassword: boolean;
  isDefault: boolean;
}

class AuthService {
  private deletionAuthorized = false;
  private authTimestamp = 0;
  private readonly AUTH_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Verify deletion password
   */
  async verifyDeletionPassword(password: string): Promise<boolean> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-deletion`, {
        password
      });
      
      if (response.data.success) {
        this.deletionAuthorized = true;
        this.authTimestamp = Date.now();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Deletion password verification failed:', error);
      throw new Error(error.response?.data?.error || 'Failed to verify deletion password');
    }
  }

  /**
   * Check if user is currently authorized for deletion
   */
  isDeleteAuthorized(): boolean {
    if (!this.deletionAuthorized) return false;
    
    const timePassed = Date.now() - this.authTimestamp;
    if (timePassed > this.AUTH_DURATION) {
      this.deletionAuthorized = false;
      return false;
    }
    
    return true;
  }

  /**
   * Clear deletion authorization
   */
  clearDeletionAuth(): void {
    this.deletionAuthorized = false;
    this.authTimestamp = 0;
  }

  /**
   * Get remaining auth time in seconds
   */
  getRemainingAuthTime(): number {
    if (!this.deletionAuthorized) return 0;
    
    const timePassed = Date.now() - this.authTimestamp;
    const remaining = Math.max(0, this.AUTH_DURATION - timePassed);
    return Math.floor(remaining / 1000);
  }

  /**
   * Change deletion password
   */
  async changeDeletionPassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/change-deletion-password`, {
        currentPassword,
        newPassword
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to change password');
      }
      
      // Clear current auth since password changed
      this.clearDeletionAuth();
    } catch (error: any) {
      console.error('Change deletion password failed:', error);
      throw new Error(error.response?.data?.error || 'Failed to change deletion password');
    }
  }

  /**
   * Request password reset via email
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/request-password-reset`, {
        email
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to request password reset');
      }
    } catch (error: any) {
      console.error('Password reset request failed:', error);
      throw new Error(error.response?.data?.error || 'Failed to request password reset');
    }
  }

  /**
   * Reset password using token
   */
  async resetDeletionPassword(token: string, newPassword: string): Promise<void> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/reset-deletion-password`, {
        token,
        newPassword
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Password reset failed:', error);
      throw new Error(error.response?.data?.error || 'Failed to reset password');
    }
  }

  /**
   * Get deletion status (whether password is set and if it's default)
   */
  async getDeletionStatus(): Promise<DeletionStatus> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/deletion-status`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Failed to get deletion status');
    } catch (error: any) {
      console.error('Get deletion status failed:', error);
      throw new Error(error.response?.data?.error || 'Failed to get deletion status');
    }
  }

  /**
   * Get the admin email for password reset
   */
  getAdminEmail(): string {
    return 'ahsantoufiq@hotmail.com';
  }
}

// Export a singleton instance
export const authService = new AuthService();
export default authService; 