import React from 'react';
import { Stepper, Step, StepLabel } from '@mui/material';

const STEPS = ['Configure', 'Preview', 'Build'];

interface StepBarProps {
  step: number;
}

/**
 * Three-step progress indicator (Configure → Preview → Build).
 *
 * Wraps MUI's `Stepper` so that active and completed states, the connector
 * line, and the check icon on finished steps are all handled automatically
 * by the Docker MUI theme.  `step` is 1-based to match the app's state convention.
 */
export const StepBar: React.FC<StepBarProps> = ({ step }) => (
  <Stepper activeStep={step - 1} sx={{ py: 3 }} data-testid="step-bar">
    {STEPS.map((label, i) => (
      <Step key={label} data-testid={`step-circle-${i + 1}`}>
        <StepLabel>{label}</StepLabel>
      </Step>
    ))}
  </Stepper>
);

export default StepBar;
