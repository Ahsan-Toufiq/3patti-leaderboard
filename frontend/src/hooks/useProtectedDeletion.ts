import { useState, useCallback } from 'react';
import { authService } from '../services/authService';

interface ModalConfig {
  title: string;
  description: string;
}

interface ProtectedDeletionOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export interface ProtectedDeletionHook {
  isModalOpen: boolean;
  modalConfig: ModalConfig;
  openDeletionModal: (config: ModalConfig) => void;
  closeDeletionModal: () => void;
  executeProtectedDeletion: () => Promise<void>;
  isProcessing: boolean;
}

const useProtectedDeletion = (
  deletionAction: () => Promise<void>,
  options: ProtectedDeletionOptions = {}
): ProtectedDeletionHook => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    title: 'Confirm Deletion',
    description: 'This action cannot be undone.'
  });

  const openDeletionModal = useCallback((config: ModalConfig) => {
    setModalConfig(config);
    setIsModalOpen(true);
  }, []);

  const closeDeletionModal = useCallback(() => {
    setIsModalOpen(false);
    setIsProcessing(false);
    options.onCancel?.();
  }, [options]);

  const executeProtectedDeletion = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      // Check if already authorized
      if (!authService.isDeleteAuthorized()) {
        throw new Error('Deletion not authorized. Please verify password first.');
      }
      
      // Execute the deletion action
      await deletionAction();
      
      // Close modal and call success callback
      setIsModalOpen(false);
      options.onSuccess?.();
    } catch (error: any) {
      console.error('Protected deletion failed:', error);
      options.onError?.(error.message || 'Deletion failed');
    } finally {
      setIsProcessing(false);
    }
  }, [deletionAction, options]);

  return {
    isModalOpen,
    modalConfig,
    openDeletionModal,
    closeDeletionModal,
    executeProtectedDeletion,
    isProcessing
  };
};

export default useProtectedDeletion; 