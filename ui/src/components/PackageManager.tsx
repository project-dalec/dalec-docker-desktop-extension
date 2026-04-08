import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { PackageRow } from './PackageRow';
import type { Package, PackagesMap, DepType } from '../types';
import { DEP_TYPES, PRESET_PACKAGES } from '../constants/targets';

interface PackageManagerProps {
  packages: PackagesMap;
  availablePackages: string[];
  family: string;
  onChange: (updated: PackagesMap) => void;
}

/**
 * Tabbed package editor for all four Dalec dependency types.
 *
 * Tabs: **Runtime**, **Build**, **Recommends**, and **Test** — each showing
 * a badge with the package count for that type.  Within the active tab:
 * - A search field provides typeahead suggestions drawn from the
 *   `availablePackages` list (fetched from the backend) merged with family-
 *   specific presets. Arrow-key navigation and Enter/Escape are supported.
 * - Packages already in any tab are excluded from suggestions to avoid
 *   duplicates across dependency types.
 * - Each added package is rendered as a `PackageRow` that allows version
 *   constraints to be attached and the package to be removed.
 */
export const PackageManager: React.FC<PackageManagerProps> = ({
  packages,
  availablePackages,
  family,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<DepType>('runtime');
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const highlightedRef = useRef<any>(null);

  const allNames = Object.values(packages).flat().map((p) => p.name);

  useEffect(() => {
    if (!input) { setSuggestions([]); return; }
    const presets = PRESET_PACKAGES[family] ?? [];
    const all = Array.from(new Set([...presets, ...availablePackages]));
    setSuggestions(
      all
        .filter((p) => p.includes(input.toLowerCase()) && !allNames.includes(p))
        .slice(0, 8),
    );
    setHighlightedIdx(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, family, allNames.join(',')]);

  useEffect(() => {
    highlightedRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [highlightedIdx]);

  const addPackage = (name?: string) => {
    const trimmed = (name ?? input).trim();
    if (!trimmed || allNames.includes(trimmed)) { setInput(''); setSuggestions([]); return; }
    onChange({
      ...packages,
      [activeTab]: [...(packages[activeTab] ?? []), { name: trimmed, versions: [] }],
    });
    setInput(''); setSuggestions([]);
  };

  const updatePackage = (depType: DepType, idx: number, updated: Package) => {
    const list = [...(packages[depType] ?? [])];
    list[idx] = updated;
    onChange({ ...packages, [depType]: list });
  };

  const removePackage = (depType: DepType, idx: number) => {
    onChange({ ...packages, [depType]: (packages[depType] ?? []).filter((_, i) => i !== idx) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) {
      if (e.key === 'Enter') addPackage();
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIdx((i) => (i < suggestions.length - 1 ? i + 1 : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIdx((i) => (i > 0 ? i - 1 : suggestions.length - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); addPackage(suggestions[highlightedIdx]); }
    else if (e.key === 'Escape') { setSuggestions([]); setInput(''); }
  };

  const activePkgs = packages[activeTab] ?? [];
  const activeDepMeta = DEP_TYPES.find((d) => d.id === activeTab);

  return (
    <Box>
      {/* Tabs */}
      <Box sx={{ borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.5)}`, mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v: DepType) => setActiveTab(v)}
          sx={{
            minHeight: 36,
            '& .MuiTabs-indicator': { backgroundColor: 'primary.main' },
          }}
        >
          {DEP_TYPES.map((dt) => {
            const count = (packages[dt.id] ?? []).length;
            return (
              <Tab
                key={dt.id}
                value={dt.id}
                label={
                  <Box display="flex" alignItems="center" gap={0.75}>
                    <span>{dt.label}</span>
                    {count > 0 && (
                      <Box
                        component="span"
                        sx={{
                          bgcolor: activeTab === dt.id ? 'action.selected' : 'action.hover',
                          color: activeTab === dt.id ? 'primary.main' : 'text.disabled',
                          borderRadius: 99,
                          px: 0.75,
                          fontSize: 10,
                          fontWeight: 700,
                          lineHeight: 1.6,
                        }}
                      >
                        {count}
                      </Box>
                    )}
                  </Box>
                }
                sx={{
                  minHeight: 36,
                  py: 0.75,
                  px: 1.75,
                  fontSize: 12,
                  textTransform: 'none',
                  color: 'text.secondary',
                  '&.Mui-selected': { color: 'text.primary' },
                }}
              />
            );
          })}

          <Box sx={{ flex: 1 }} />

          {activeDepMeta && (
            <Typography
              variant="caption"
              color="text.disabled"
              fontStyle="italic"
              sx={{ alignSelf: 'center', pr: 1 }}
            >
              {activeDepMeta.description}
            </Typography>
          )}
        </Tabs>
      </Box>

      {/* Search input */}
      <Box sx={{ position: 'relative', mb: 1 }}>
        <Box display="flex" gap={1}>
          <Box sx={{ flex: 1, position: 'relative' }}>
            <TextField
              inputRef={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Search ${family === 'deb' ? 'apt' : family === 'rpm' ? 'rpm' : 'winget'} packages…`}
              size="small"
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
              role="combobox"
              aria-expanded={suggestions.length > 0}
              aria-controls="pkg-suggestion-list"
              aria-autocomplete="list"
            />

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <Paper
                elevation={4}
                sx={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  maxHeight: 220,
                  overflow: 'auto',
                  background: (theme) => theme.palette.background.paper,
                  border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                }}
              >
                <List dense id="pkg-suggestion-list" role="listbox" sx={{ py: 0.5 }}>
                  {suggestions.map((s, idx) => (
                    <ListItemButton
                      key={s}
                      ref={idx === highlightedIdx ? highlightedRef : null}
                      selected={idx === highlightedIdx}
                      onMouseEnter={() => setHighlightedIdx(idx)}
                      onClick={() => addPackage(s)}
                      role="option"
                      aria-selected={idx === highlightedIdx}
                      sx={{ py: 0.75, px: 1.75 }}
                    >
                      <ListItemText
                        primary={s}
                        slotProps={{
                          primary: {
                            sx: {
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: 12,
                            },
                          },
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          <Button
            onClick={() => addPackage()}
            startIcon={<AddIcon />}
            disabled={!input.trim()}
            size="small"
            sx={{
              whiteSpace: 'nowrap',
              color: 'text.primary',
              fontSize: 11,
              textTransform: 'none',
              '&:hover': { opacity: 0.8 },
            }}
          >
            Add
          </Button>
        </Box>
      </Box>

      <Typography variant="caption" color="text.disabled" fontStyle="italic" display="block" mb={1.5}>
        Suggestions are hints only — actual availability is resolved by the target's package manager at build time.
      </Typography>

      {/* Package list */}
      {activePkgs.length > 0 ? (
        <Box display="flex" flexDirection="column" gap={0.75}>
          {activePkgs.map((pkg, i) => (
            <PackageRow
              key={pkg.name}
              pkg={pkg}
              onUpdate={(u) => updatePackage(activeTab, i, u)}
              onRemove={() => removePackage(activeTab, i)}
            />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            p: 2.5,
            borderRadius: '6px',
            border: (theme) => `1px dashed ${alpha(theme.palette.divider, 0.6)}`,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.disabled">
            No {activeTab} packages yet — search above or type a name and press Enter.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PackageManager;
