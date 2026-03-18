import React from 'react';
import { Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { YamlPreview } from '../components/YamlPreview';

interface PreviewStepProps {
  yaml: string;
  buildCommand: string;
  onBack: () => void;
  onBuild: () => void;
}

export const PreviewStep: React.FC<PreviewStepProps> = ({
  yaml,
  buildCommand,
  onBack,
  onBuild,
}) => {
  return (
    <Box display="flex" flexDirection="column" gap={2.5}>
      <YamlPreview yaml={yaml} buildCommand={buildCommand} />

      <Box display="flex" justifyContent="space-between" pt={0.5}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ color: 'text.secondary' }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={onBuild}
          sx={{ px: 3.5 }}
        >
          Build
        </Button>
      </Box>
    </Box>
  );
};

export default PreviewStep;
