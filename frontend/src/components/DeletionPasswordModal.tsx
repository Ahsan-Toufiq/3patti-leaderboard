import React, { useState, useEffect, useCallback } from 'react';
import { 
  XMarkIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  ShieldExclamationIcon,
  EnvelopeIcon,
  KeyIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { authService, DeletionStatus } from '../services/authService';
import LoadingSpinner from './LoadingSpinner';

interface DeletionPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

const DeletionPasswordModal: React.FC<DeletionPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Confirm Deletion',
  description = 'This action cannot be undone.'
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const checkExistingAuth = useCallback(async () => {
    const isAuthorized = await authService.isDeleteAuthorized();
    if (isAuthorized) {
      const remaining = authService.getRemainingAuthTime();
      setRemainingTime(remaining);
      
      // Auto-approve if already authorized
      if (remaining > 0) {
        onSuccess();
        return;
      }
    }
    
    // Get deletion status
    try {
      const status = await authService.getDeletionStatus();
      setDeletionStatus(status);
      setResetEmail(authService.getAdminEmail());
    } catch (error) {
      console.error('Failed to get deletion status:', error);
    }
  }, [onSuccess]);

  // Check if already authorized and get deletion status
  useEffect(() => {
    if (isOpen) {
      checkExistingAuth();
    }
  }, [isOpen, checkExistingAuth]);

  // Update remaining time countdown
  useEffect(() => {
    if (remainingTime > 0) {
      const interval = setInterval(() => {
        const newTime = authService.getRemainingAuthTime();
        setRemainingTime(newTime);
        if (newTime <= 0) {
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [remainingTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    try {
      setIsVerifying(true);
      setError('');
      
      const success = await authService.verifyDeletionPassword(password);
      
      if (success) {
        setPassword('');
        onSuccess();
      } else {
        setError('Invalid password');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to verify password');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    try {
      setIsRequestingReset(true);
      setError('');
      
      await authService.requestPasswordReset(resetEmail);
      setResetRequested(true);
      setShowPasswordReset(false);
    } catch (error: any) {
      setError(error.message || 'Failed to request password reset');
    } finally {
      setIsRequestingReset(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setShowPasswordReset(false);
    setResetRequested(false);
    setRemainingTime(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <ShieldExclamationIcon className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {description}
            </p>
            
            {deletionStatus?.isDefault && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-yellow-800 dark:text-yellow-200 font-medium">Default Password Active</p>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      You're using the default password: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">admin123</code>. 
                      Consider changing it for better security.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {resetRequested && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <EnvelopeIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-green-800 dark:text-green-200 font-medium">Reset Email Sent</p>
                    <p className="text-green-700 dark:text-green-300 mt-1">
                      Password reset instructions have been sent to {resetEmail}. Check your email for the reset link.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Password Reset Form */}
          {showPasswordReset ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label htmlFor="resetEmail" className="form-label">
                  Admin Email Address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="form-input pl-10"
                    placeholder="Enter admin email"
                    required
                    disabled={isRequestingReset}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Password reset is only available for the configured admin email
                </p>
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(false)}
                  className="flex-1 btn btn-secondary"
                  disabled={isRequestingReset}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                  disabled={isRequestingReset || !resetEmail.trim()}
                >
                  {isRequestingReset ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      Send Reset Email
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Password Entry Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="form-label">
                  Deletion Password
                </label>
                <div className="relative">
                  <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input pl-10 pr-10"
                    placeholder="Enter deletion password"
                    required
                    disabled={isVerifying}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 btn btn-secondary"
                  disabled={isVerifying}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-danger"
                  disabled={isVerifying || !password.trim()}
                >
                  {isVerifying ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Confirm Deletion'
                  )}
                </button>
              </div>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot password? Request reset
                </button>
              </div>
            </form>
          )}

          {/* Auth Status */}
          {remainingTime > 0 && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                Already authorized for {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')} minutes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeletionPasswordModal; 