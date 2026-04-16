import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Container } from '@mui/material';
import { AppHeader } from './components/AppHeader';
import { StepBar } from './components/StepBar';
import { ConfigureStep } from './steps/ConfigureStep';
import { PreviewStep } from './steps/PreviewStep';
import { BuildStep } from './steps/BuildStep';
import { generateYAML, generateBuildCommand } from './utils/yamlGenerator';
import { EMPTY_PACKAGES_MAP, getBuildTarget, BUILD_POLL_INTERVAL_MS } from './constants/targets';
import { getAvailableTargets } from './api/osApi';
import { getPackages } from './api/packageApi';
import { startBuild, getBuildStatus } from './api/buildApi';
import type { ImageSpec, BuildResult, Target } from './types';

const INITIAL_SPEC: ImageSpec = {
  name:        'hello-runtime-only',
  version:     '0.1.0',
  description: '',
  website:     '',
  revision:    '1',
  license:     '',
  target:      null,
  packages: {
    ...EMPTY_PACKAGES_MAP(),
    runtime: [
      { name: 'curl', versions: [] },
      { name: 'bash', versions: [] },
    ],
  },
  entrypoint: '/usr/bin/curl',
  cmd:        '--version',
  workdir:    '',
  user:       '',
  envVars:    [{ key: '', value: '' }],
  labels:     [{ key: '', value: '' }],
};

export default function App() {
  const [step, setStep]                         = useState<1 | 2 | 3>(1);
  const [spec, setSpec]                         = useState<ImageSpec>(INITIAL_SPEC);
  const [availableTargets, setAvailableTargets] = useState<Target[]>([]);
  const [targetsLoading, setTargetsLoading]     = useState(true);
  const [availablePackages, setAvailablePackages] = useState<string[]>([]);

  // Build state
  const [building, setBuilding]     = useState(false);
  const [buildDone, setBuildDone]   = useState(false);
  const [logLines, setLogLines]     = useState<string[]>([]);
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const pollRef = useRef<number | null>(null);

  // Load remote data on mount
  useEffect(() => {
    getAvailableTargets().then((targets) => {
      setAvailableTargets(targets);
      setTargetsLoading(false);
      if (targets.length > 0) {
        setSpec((prev) => ({ ...prev, target: prev.target ?? targets[0] }));
      }
    });
    getPackages().then(setAvailablePackages);
  }, []);

  const patchSpec = useCallback((patch: Partial<ImageSpec>) => {
    setSpec((prev) => ({ ...prev, ...patch }));
  }, []);

  const yaml = useMemo(() => generateYAML(spec), [spec]);
  const buildCommand = useMemo(() => generateBuildCommand(spec), [spec]);

  // ── Build lifecycle ───────────────────────────────────────────────────────

  const executeBuild = useCallback(async () => {
    // Clear any existing poller before starting a new build
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    setBuilding(true);
    setBuildDone(false);
    setLogLines([]);
    setBuildResult(null);

    const allPackages = Object.values(spec.packages).flat().map((p) => p.name);
    const yamlSpec = generateYAML(spec);

    try {
      const { buildId } = await startBuild({
        imageName: `${spec.name}:${spec.version}`,
        osTarget:  spec.target ? getBuildTarget(spec.target) : '',
        yamlSpec,
        packages:  allPackages,
      });

      // Poll for status + logs
      let lastLogIdx = 0;
      pollRef.current = window.setInterval(async () => {
        try {
          const result = await getBuildStatus(buildId);

          if (result.logs && result.logs.length > lastLogIdx) {
            const newLines = result.logs
              .slice(lastLogIdx)
              .flatMap((chunk) => chunk.split('\n'))
              .filter((line) => line.trim() !== '');
            setLogLines((prev) => [...prev, ...newLines]);
            lastLogIdx = result.logs.length;
          }

          if (result.status !== 'running') {
            if (pollRef.current !== null) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            setBuilding(false);

            if (result.status === 'completed' && result.imageName) {
              setBuildDone(true);
              setBuildResult({
                imageName: result.imageName,
                osTarget:  result.osTarget ?? spec.target?.id ?? '',
                packages:  result.packages ?? allPackages,
                digest:    result.digest,
              });
            } else {
              setLogLines((prev) => [
                ...prev,
                result.error ? `ERROR: ${result.error}` : 'Build failed.',
              ]);
            }
          }
        } catch (err) {
          if (pollRef.current !== null) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setBuilding(false);
          setLogLines((prev) => [...prev, `Error polling build status: ${String(err)}`]);
        }
      }, BUILD_POLL_INTERVAL_MS);
    } catch (err) {
      setBuilding(false);
      setLogLines([`Failed to start build: ${String(err)}`]);
    }
  }, [spec]);

  // Clear any active poller if the component unmounts
  useEffect(() => {
    return () => {
      if (pollRef.current !== null) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  const handleStartBuild = useCallback(() => {
    setStep(3);
    executeBuild();
  }, [executeBuild]);


  const handleNewBuild = () => {
    setSpec({ ...INITIAL_SPEC, target: availableTargets[0] ?? null });
    setBuildDone(false);
    setBuilding(false);
    setLogLines([]);
    setBuildResult(null);
    setStep(1);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader />
      <Container maxWidth="md" sx={{ pb: 10 }}>
        <StepBar step={step} />

        {step === 1 && (
          <ConfigureStep
            spec={spec}
            availableTargets={availableTargets}
            targetsLoading={targetsLoading}
            availablePackages={availablePackages}
            onSpecChange={patchSpec}
            onNext={() => setStep(2)}
            onSkipToBuild={handleStartBuild}
          />
        )}

        {step === 2 && (
          <PreviewStep
            yaml={yaml}
            buildCommand={buildCommand}
            onBack={() => setStep(1)}
            onBuild={handleStartBuild}
          />
        )}

        {step === 3 && (
          <BuildStep
            spec={spec}
            building={building}
            buildDone={buildDone}
            logLines={logLines}
            buildResult={buildResult}
            onBack={() => setStep(2)}


            onNewBuild={handleNewBuild}
            onClearLogs={() => setLogLines([])}
          />
        )}
      </Container>
    </Box>
  );
}
