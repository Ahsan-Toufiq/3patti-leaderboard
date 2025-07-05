import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { ApiResponse } from '../types';

const router = express.Router();

// In-memory storage for deletion password and reset tokens
// In production, this should be stored in a database
let deletionPasswordHash: string | null = null;
let resetTokens: Map<string, { email: string; expires: Date }> = new Map();

const ADMIN_EMAIL = 'ahsantoufiq@hotmail.com';
const DEFAULT_PASSWORD = 'admin123'; // Default password, should be changed on first use

// Initialize default password
const initializeDefaultPassword = async () => {
  if (!deletionPasswordHash) {
    deletionPasswordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    console.log('🔐 Default deletion password initialized: admin123');
  }
};

// Email transporter configuration
const createEmailTransporter = () => {
  // For development, you can use a service like Gmail
  // In production, use a proper email service
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// POST /api/auth/verify-deletion - Verify deletion password
router.post('/verify-deletion', async (req: Request, res: Response) => {
  try {
    await initializeDefaultPassword();
    
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }
    
    if (!deletionPasswordHash) {
      return res.status(500).json({
        success: false,
        error: 'Deletion password not configured'
      });
    }
    
    const isValid = await bcrypt.compare(password, deletionPasswordHash);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid deletion password'
      });
    }
    
    const response: ApiResponse<{ authorized: boolean }> = {
      success: true,
      data: { authorized: true },
      message: 'Deletion authorized'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Verify deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify deletion password'
    });
  }
});

// POST /api/auth/change-deletion-password - Change deletion password
router.post('/change-deletion-password', async (req: Request, res: Response) => {
  try {
    await initializeDefaultPassword();
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }
    
    if (!deletionPasswordHash) {
      return res.status(500).json({
        success: false,
        error: 'Deletion password not configured'
      });
    }
    
    const isCurrentValid = await bcrypt.compare(currentPassword, deletionPasswordHash);
    
    if (!isCurrentValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    deletionPasswordHash = await bcrypt.hash(newPassword, 10);
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Deletion password changed successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Change deletion password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change deletion password'
    });
  }
});

// POST /api/auth/request-password-reset - Request password reset via email
router.post('/request-password-reset', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    // Verify this is the admin email
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'Password reset is only available for the configured admin email'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    resetTokens.set(resetToken, { email, expires });
    
    // Clean up expired tokens
    for (const [token, data] of resetTokens.entries()) {
      if (data.expires < new Date()) {
        resetTokens.delete(token);
      }
    }
    
    // Send email (in development, just log the token)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Password Reset Token:', resetToken);
      console.log('📧 Reset URL would be sent to:', email);
      console.log('🕒 Token expires at:', expires.toISOString());
    } else {
      try {
        const transporter = createEmailTransporter();
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-deletion-password?token=${resetToken}`;
        
        await transporter.sendMail({
          from: process.env.EMAIL_USER || 'noreply@3patti-leaderboard.com',
          to: email,
          subject: '3 Patti Leaderboard - Password Reset',
          html: `
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your deletion password for the 3 Patti Leaderboard application.</p>
            <p>Click the link below to reset your password (valid for 15 minutes):</p>
            <p><a href="${resetUrl}">Reset Password</a></p>
            <p>If you didn't request this reset, you can safely ignore this email.</p>
          `
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the request if email fails in development
        if (process.env.NODE_ENV !== 'development') {
          throw emailError;
        }
      }
    }
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Password reset instructions sent to your email'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send password reset email'
    });
  }
});

// POST /api/auth/reset-deletion-password - Reset password using token
router.post('/reset-deletion-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Reset token and new password are required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }
    
    const tokenData = resetTokens.get(token);
    
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }
    
    if (tokenData.expires < new Date()) {
      resetTokens.delete(token);
      return res.status(400).json({
        success: false,
        error: 'Reset token has expired'
      });
    }
    
    // Reset the password
    deletionPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Remove the used token
    resetTokens.delete(token);
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Deletion password reset successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Reset deletion password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset deletion password'
    });
  }
});

// GET /api/auth/deletion-status - Check if user has deletion privileges
router.get('/deletion-status', async (req: Request, res: Response) => {
  try {
    await initializeDefaultPassword();
    
    const response: ApiResponse<{ hasPassword: boolean; isDefault: boolean }> = {
      success: true,
      data: {
        hasPassword: !!deletionPasswordHash,
        isDefault: deletionPasswordHash ? await bcrypt.compare(DEFAULT_PASSWORD, deletionPasswordHash) : false
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Deletion status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check deletion status'
    });
  }
});

export default router; 