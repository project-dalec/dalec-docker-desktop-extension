import React, { useEffect, useState, useRef } from 'react';
import { createDockerDesktopClient } from '@docker/extension-api-client';
import {
  Container,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip,
  Link
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LogViewer from './components/LogViewer.jsx';
import { parseVersionConstraints } from './utils/versionParser.js';

const ddClient = createDockerDesktopClient();

// OS Targets with labels
const OS_TARGETS = [
  { value: 'mariner2', label: 'Azure Linux 2 (formerly CBL-Mariner)' },
  { value: 'azlinux3', label: 'Azure Linux 3' },
  { value: 'bullseye', label: 'Debian 11 (Bullseye) (v0.11)' },
  { value: 'bookworm', label: 'Debian 12 (Bookworm) (v0.11)' },
  { value: 'trixie', label: 'Debian 13 (Trixie) (v0.next)' },
  { value: 'bionic', label: 'Ubuntu 18.04 (Bionic) (v0.11)' },
  { value: 'focal', label: 'Ubuntu 20.04 (focal) (v0.11)' },
  { value: 'jammy', label: 'Ubuntu 22.04 (jammy) (v0.9)' },
  { value: 'noble', label: 'Ubuntu 24.04 (noble) (v0.11)' },
  { value: 'windowscross', label: 'Cross compile from Ubuntu Jammy to Windows' },
  { value: 'almalinux9', label: 'AlmaLinux 9 (v0.13)' },
  { value: 'almalinux8', label: 'AlmaLinux 8 (v0.13)' },
  { value: 'rockylinux8', label: 'Rocky Linux 8 (v0.13)' },
  { value: 'rockylinux9', label: 'Rocky Linux 9 (v0.13)' },
];

export default function App() {
  const [packages, setPackages] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([
    { name: 'curl', version: '', type: 'runtime' },
    { name: 'bash', version: '', type: 'runtime' }
  ]);
  const dependencyTypes = ['build', 'runtime', 'recommends', 'sysext', 'test'];
  const [packageSearch, setPackageSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [imageName, setImageName] = useState('my-minimal-image:0.1.0');
  const [osTarget, setOsTarget] = useState('azlinux3');
  const [buildId, setBuildId] = useState(null);
  const [status, setStatus] = useState(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [commandPreview, setCommandPreview] = useState('');
  const [buildResult, setBuildResult] = useState(null);
  const searchInputRef = useRef(null);
  const highlightedItemRef = useRef(null);

  useEffect(() => {
    // Fetch packages from backend via Docker extension SDK
    ddClient.extension.vm.service.get('/api/packages')
      .then(setPackages)
      .catch(() => setPackages([
        'curl', 'bash', 'git', 'wget', 'vim', 'ca-certificates',
        'openssl', 'jq', 'tar', 'gzip', 'sed', 'awk', 'grep',
        'python3', 'nodejs', 'nginx', 'postgresql', 'redis',
        'sqlite', 'gcc', 'make', 'cmake', 'go', 'rust',
        'perl', 'ruby', 'php', 'java', 'maven', 'gradle',
        'docker', 'kubectl', 'helm', 'terraform', 'ansible',
        'tmux', 'screen', 'htop', 'net-tools', 'iputils',
        'bind-utils', 'openssh-client', 'rsync', 'unzip', 'zip',
        'less', 'nano', 'emacs', 'tree', 'findutils',
        'coreutils', 'util-linux', 'procps', 'psmisc'
      ]));
  }, []);

  useEffect(() => {
    // Group packages by type
    const depsByType = selectedPackages.reduce((acc, p) => {
      if (!acc[p.type]) acc[p.type] = {};

      // Parse version constraints using utility function
      const versionConstraints = parseVersionConstraints(p.version);

      acc[p.type][p.name] = versionConstraints.length > 0
        ? { version: versionConstraints }
        : {};
      return acc;
    }, {});

    // Build dependencies object with each type on separate line
    const depsLines = Object.entries(depsByType)
      .map(([type, pkgs]) => `    "${type}": ${JSON.stringify(pkgs)}`)
      .join(',\n');

    const depsObj = `{\n${depsLines}\n  }`;

    const cmd = `docker build \\\n  -t ${imageName} \\\n  --build-arg BUILDKIT_SYNTAX=ghcr.io/project-dalec/dalec/frontend:latest \\\n  --target=${osTarget}/container/depsonly \\\n  -<<<"$(jq -c '.dependencies = ${depsObj} | .image.entrypoint = "/bin/bash"' <<<"{}" )"`;
    setCommandPreview(cmd);
  }, [imageName, osTarget, selectedPackages]);

  // Filter packages not already added with same name AND type
  const searchResults = packages
    .filter(p => {
      const lowerSearch = packageSearch.toLowerCase();
      const matchesSearch = p.toLowerCase().includes(lowerSearch);
      return matchesSearch;
    })
    .slice(0, 10);

  const showDropdown = isSearchFocused && packageSearch.length > 0 && searchResults.length > 0;

  // Reset highlighted index when search results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchResults.length, packageSearch]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (highlightedItemRef.current) {
      highlightedItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [highlightedIndex]);

  const addPackage = (packageName, type = 'runtime') => {
    // Allow adding same package with different type
    const exists = selectedPackages.find(p => p.name === packageName && p.type === type);
    if (!exists) {
      setSelectedPackages([...selectedPackages, { name: packageName, version: '', type }]);
      setPackageSearch('');
      setHighlightedIndex(0);
      searchInputRef.current?.blur();
    }
  };

  const removePackage = (packageName, type) => {
    setSelectedPackages(selectedPackages.filter(p => !(p.name === packageName && p.type === type)));
  };

  const updatePackageVersion = (packageName, type, version) => {
    setSelectedPackages(
      selectedPackages.map(p =>
        (p.name === packageName && p.type === type) ? { ...p, version } : p
      )
    );
  };

  const updatePackageType = (packageName, oldType, newType) => {
    // Check if package with new type already exists
    const exists = selectedPackages.find(p => p.name === packageName && p.type === newType);
    if (!exists) {
      setSelectedPackages(
        selectedPackages.map(p =>
          (p.name === packageName && p.type === oldType) ? { ...p, type: newType } : p
        )
      );
    }
  };

  const handleSearchKeyDown = (e) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults.length > 0) {
          addPackage(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsSearchFocused(false);
        setPackageSearch('');
        setHighlightedIndex(0);
        searchInputRef.current?.blur();
        break;
    }
  };

  const startBuild = async () => {
    setIsBuilding(true);
    setStatus(null);
    setBuildId(null);
    setBuildResult(null);
    try {
      console.log('Starting build with:', { imageName, osTarget, packages: selectedPackages });

      // Group packages by type for backend
      const packagesByType = selectedPackages.reduce((acc, p) => {
        if (!acc[p.type]) acc[p.type] = [];
        acc[p.type].push(p.name);
        return acc;
      }, {});

      const data = await ddClient.extension.vm.service.post('/api/build', {
        imageName,
        osTarget,
        packages: selectedPackages.map(p => p.name), // Keep for backward compat
        packagesByType // New field with type info
      });

      console.log('Build started:', data);
      setBuildId(data.buildId);
      subscribeLogs(data.buildId);
    } catch (e) {
      console.error('Build start error:', e);
      setStatus('error: ' + e.message);
      setIsBuilding(false);
    }
  };

  const subscribeLogs = (id) => {
    console.log('Subscribing to logs for build:', id);
    let lastLogIndex = 0;
    let pollInterval;

    const pollLogs = async () => {
      try {
        const result = await ddClient.extension.vm.service.get(`/api/build/${id}/status`);

        // Send new logs to viewer
        if (result.logs && result.logs.length > lastLogIndex) {
          for (let i = lastLogIndex; i < result.logs.length; i++) {
            window.dispatchEvent(new CustomEvent('dalec-log', { detail: result.logs[i] }));
          }
          lastLogIndex = result.logs.length;
        }

        // Check if build is finished
        if (result.status !== 'running') {
          clearInterval(pollInterval);
          setIsBuilding(false);
          setStatus(result.status);

          if (result.status === 'completed' && result.imageName) {
            setBuildResult({
              imageName: result.imageName,
              osTarget: result.osTarget,
              packages: result.packages
            });
          } else if (result.error) {
            setStatus('error: ' + result.error);
          }
        }
      } catch (err) {
        console.error('Error polling logs:', err);
        clearInterval(pollInterval);
        setIsBuilding(false);
        setStatus('error: ' + err.message);
      }
    };

    // Poll every 500ms
    pollInterval = setInterval(pollLogs, 500);
    pollLogs(); // Call immediately
  };

  const runImage = async () => {
    if (!buildResult) return;
    try {
      const data = await ddClient.extension.vm.service.post('/api/image/run', {
        imageName: buildResult.imageName
      });
      alert(`Container started: ${data.containerId}\nRun: docker logs ${data.containerId}`);
    } catch (e) {
      alert('Failed to run image: ' + e.message);
    }
  };

  const inspectImage = async () => {
    if (!buildResult) return;
    try {
      const result = await ddClient.docker.cli.exec('image', [
        'inspect',
        buildResult.imageName
      ]);

      // docker inspect returns an array, so get first element
      const inspectData = result.parseJsonObject();
      const imageData = Array.isArray(inspectData) ? inspectData[0] : inspectData;


      const info = `Image: ${buildResult.imageName}\nSize: ${(imageData.Size / 1024 / 1024).toFixed(2)} MB\nCreated: ${new Date(imageData.Created).toLocaleString()}\nArchitecture: ${imageData.Architecture}\nOS: ${imageData.Os}`;
      alert(info);
    } catch (e) {
      alert('Failed to inspect image: ' + e.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Typography variant="h4" component="h1">
          Dalec Minimal Image Builder
        </Typography>
      </Box>

      <Stack spacing={3}>
        <TextField
          label="Image Name"
          value={imageName}
          onChange={e => setImageName(e.target.value)}
          placeholder="my-image:tag"
          fullWidth
        />

        <FormControl fullWidth>
          <InputLabel>OS Target</InputLabel>
          <Select
            value={osTarget}
            label="OS Target"
            onChange={e => setOsTarget(e.target.value)}
          >
            {OS_TARGETS.map(os => (
              <MenuItem key={os.value} value={os.value}>{os.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              Packages ({selectedPackages.length} selected of {packages.length} available)
            </Typography>
            <Tooltip
              title={
                <Box>
                  <Typography variant="body2" gutterBottom>
                    <strong>Dependency Types:</strong>
                  </Typography>
                  <Typography variant="body2" component="div">
                    • <strong>build:</strong> Required during build time<br/>
                    • <strong>runtime:</strong> Required at runtime<br/>
                    • <strong>recommends:</strong> Optional runtime dependencies<br/>
                    • <strong>sysext:</strong> System extensions<br/>
                    • <strong>test:</strong> Test dependencies
                  </Typography>
                  <Link
                    href="https://project-dalec.github.io/dalec/dependencies#example"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'block', mt: 1, color: 'primary.light' }}
                  >
                    Learn more →
                  </Link>
                </Box>
              }
              arrow
              placement="right"
            >
              <IconButton size="small" sx={{ mb: 1 }}>
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ position: 'relative', mb: 2 }}>
            <TextField
              inputRef={searchInputRef}
              placeholder="Search packages..."
              value={packageSearch}
              onChange={(e) => setPackageSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyDown={handleSearchKeyDown}
              size="small"
              fullWidth
              role="combobox"
              aria-expanded={showDropdown}
              aria-controls="package-search-listbox"
              aria-activedescendant={showDropdown ? `package-option-${highlightedIndex}` : undefined}
              aria-autocomplete="list"
            />

            {showDropdown && (
              <Paper
                elevation={3}
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  maxHeight: '200px',
                  overflow: 'auto',
                  mt: 0.5
                }}
              >
                <List
                  dense
                  sx={{ py: 0 }}
                  role="listbox"
                  id="package-search-listbox"
                  aria-label="Available packages"
                >
                  {searchResults.map((pkg, index) => (
                    <ListItem key={pkg} disablePadding>
                      <ListItemButton
                        ref={index === highlightedIndex ? highlightedItemRef : null}
                        selected={index === highlightedIndex}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => addPackage(pkg)}
                        id={`package-option-${index}`}
                        role="option"
                        aria-selected={index === highlightedIndex}
                      >
                        <ListItemText primary={pkg} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          {selectedPackages.length > 0 ? (
            <Paper variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Package</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Version</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPackages
                    .sort((a, b) => {
                      const typeCompare = a.type.localeCompare(b.type);
                      return typeCompare !== 0 ? typeCompare : a.name.localeCompare(b.name);
                    })
                    .map((pkg) => (
                      <TableRow key={`${pkg.name}-${pkg.type}`}>
                        <TableCell>{pkg.name}</TableCell>
                        <TableCell>
                          <FormControl size="small" variant="standard" fullWidth>
                            <Select
                              value={pkg.type}
                              onChange={(e) => updatePackageType(pkg.name, pkg.type, e.target.value)}
                            >
                              {dependencyTypes.map(type => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={pkg.version}
                            onChange={(e) => updatePackageVersion(pkg.name, pkg.type, e.target.value)}
                            placeholder=">=1.0.0, <2.0.0"
                            size="small"
                            variant="standard"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => removePackage(pkg.name, pkg.type)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Paper>
          ) : (
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No packages selected. Search and add packages above.
              </Typography>
            </Paper>
          )}
        </Box>

        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={startBuild}
          disabled={isBuilding || selectedPackages.length === 0}
          fullWidth
        >
          {isBuilding ? 'Building…' : 'Create Image'}
        </Button>

        <Typography variant="body2" color="text.secondary">
          Status: {status || (isBuilding ? 'running' : 'idle')}
        </Typography>
      </Stack>

      {buildResult && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <AlertTitle>Build Successful!</AlertTitle>
          <Typography variant="body2" gutterBottom>
            <strong>Image:</strong> <code>{buildResult.imageName}</code>
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>OS Target:</strong> {buildResult.osTarget}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Packages:</strong> {buildResult.packages.join(', ')}
          </Typography>
          <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
            <Button variant="contained" color="primary" size="small" onClick={runImage}>
              🚀 Run Image
            </Button>
            <Button variant="outlined" color="primary" size="small" onClick={inspectImage}>
              🔍 Inspect
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => navigator.clipboard.writeText(buildResult.imageName)}
            >
              📋 Copy Image Name
            </Button>
          </Stack>
        </Alert>
      )}

      {status === 'failed' && (
        <Alert severity="error" sx={{ mt: 3 }}>
          <AlertTitle>Build Failed</AlertTitle>
          <Typography variant="body2">Check the logs below for details.</Typography>
        </Alert>
      )}

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Command Preview
        </Typography>
        <Paper
          component="pre"
          variant="outlined"
          sx={{
            p: 2,
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            overflow: 'auto',
            bgcolor: 'background.default',
            whiteSpace: 'pre-wrap'
          }}
        >
          {commandPreview}
        </Paper>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Build Logs
        </Typography>
        <LogViewer buildId={buildId} />
      </Box>

      <Box mt={4} textAlign="center">
        <Typography variant="caption" color="text.secondary">
          Powered by Dalec BuildKit Frontend
        </Typography>
      </Box>
    </Container>
  );
}
