import React from 'react';
import { Box, TextField, IconButton, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import type { KVItem } from '../types';

interface KVListProps {
  items: KVItem[];
  onChange: (items: KVItem[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

/**
 * Generic editable list of key-value pairs.
 *
 * Renders one row per `KVItem` with a narrow key field (flex 1) and a wider
 * value field (flex 2), both using a monospace font. Each row has a remove
 * button, and an "Add" button at the bottom appends a blank entry.
 * All mutations are surfaced via the `onChange` callback with the full updated
 * array, keeping this component fully controlled.
 *
 * Used by `ImageConfig` for both environment variables and image labels.
 */
export const KVList: React.FC<KVListProps> = ({
  items,
  onChange,
  keyPlaceholder = 'KEY',
  valuePlaceholder = 'VALUE',
}) => {
  const update = (i: number, field: keyof KVItem, val: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  return (
    <Box display="flex" flexDirection="column" gap={0.75}>
      {items.map((item, i) => (
        <Box key={i} display="flex" gap={0.75} alignItems="center">
          <TextField
            value={item.key}
            placeholder={keyPlaceholder}
            onChange={(e) => update(i, 'key', e.target.value)}
            size="small"
            sx={{
              flex: 1,
              '& input': { fontFamily: 'JetBrains Mono, monospace', fontSize: 12 },
            }}
          />
          <TextField
            value={item.value}
            placeholder={valuePlaceholder}
            onChange={(e) => update(i, 'value', e.target.value)}
            size="small"
            sx={{
              flex: 2,
              '& input': { fontFamily: 'JetBrains Mono, monospace', fontSize: 12 },
            }}
          />
          <IconButton
            size="small"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            aria-label="Remove row"
            sx={{
              color: 'error.main',
              opacity: 0.6,
              border: '1px solid',
              borderColor: 'error.main',
              borderRadius: '4px',
              p: 0.5,
              '&:hover': { opacity: 1 },
            }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      ))}
      <Button
        startIcon={<AddIcon />}
        onClick={() => onChange([...items, { key: '', value: '' }])}
        size="small"
        sx={{
          alignSelf: 'flex-start',
          color: 'text.secondary',
          fontSize: 11,
          textTransform: 'none',
          '&:hover': { color: 'text.primary' },
        }}
      >
        Add
      </Button>
    </Box>
  );
};

export default KVList;
