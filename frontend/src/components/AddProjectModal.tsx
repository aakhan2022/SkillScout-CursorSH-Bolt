import React, { useState } from 'react';
import { repositoryService } from '../services/repository';

const AddProjectModal = ({ onClose }) => {
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddProject = async () => {
    setLoading(true);
    try {
      const repository = await repositoryService.addRepository(selectedRepo);
      
      // Start polling for analysis status
      const pollInterval = setInterval(async () => {
        const updatedRepo = await repositoryService.pollAnalysisStatus(repository.id);
        if (updatedRepo.analysis_status === 'complete' || updatedRepo.analysis_status === 'failed') {
          clearInterval(pollInterval);
          onClose();
        }
      }, 5000); // Poll every 5 seconds

      // Clear interval after 5 minutes (timeout)
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 300000);

    } catch (error) {
      console.error('Failed to add repository:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the component
};

export default AddProjectModal; 