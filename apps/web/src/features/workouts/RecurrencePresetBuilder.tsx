'use client';

import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { RecurrencePreset } from '@fitflow/shared';

type Weekday = NonNullable<RecurrencePreset['daysOfWeek']>[number];

const WEEKDAYS: { value: Weekday; label: string }[] = [
  { value: 'MO', label: 'Mon' },
  { value: 'TU', label: 'Tue' },
  { value: 'WE', label: 'Wed' },
  { value: 'TH', label: 'Thu' },
  { value: 'FR', label: 'Fri' },
  { value: 'SA', label: 'Sat' },
  { value: 'SU', label: 'Sun' },
];

interface RecurrencePresetBuilderProps {
  value: RecurrencePreset;
  onChange: (value: RecurrencePreset) => void;
}

export default function RecurrencePresetBuilder({ value, onChange }: RecurrencePresetBuilderProps) {
  const toggleDay = (day: Weekday) => {
    const days = value.daysOfWeek ?? [];
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    onChange({ ...value, daysOfWeek: next });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Recurrence
      </Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel id="recurrence-type-label">Repeat</InputLabel>
        <Select
          labelId="recurrence-type-label"
          label="Repeat"
          value={value.type}
          onChange={(e) =>
            onChange({
              ...value,
              type: e.target.value as RecurrencePreset['type'],
            })
          }
        >
          <MenuItem value="none">One-time</MenuItem>
          <MenuItem value="daily">Daily</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
        </Select>
      </FormControl>

      {value.type === 'weekly' && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 1 }}>
          {WEEKDAYS.map((day) => (
            <Chip
              key={day.value}
              label={day.label}
              color={(value.daysOfWeek ?? []).includes(day.value) ? 'primary' : 'default'}
              onClick={() => toggleDay(day.value)}
              variant={(value.daysOfWeek ?? []).includes(day.value) ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      )}

      {value.type !== 'none' && (
        <>
          <TextField
            fullWidth
            label="Duration (minutes)"
            type="number"
            margin="normal"
            value={value.durationMinutes}
            onChange={(e) =>
              onChange({ ...value, durationMinutes: Number(e.target.value) || 60 })
            }
          />
          <TextField
            fullWidth
            label="End date (optional)"
            type="datetime-local"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={value.endDate ? value.endDate.slice(0, 16) : ''}
            onChange={(e) =>
              onChange({
                ...value,
                endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
              })
            }
          />
        </>
      )}
    </Box>
  );
}

export function defaultRecurrencePreset(): RecurrencePreset {
  return {
    type: 'none',
    durationMinutes: 60,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Kyiv',
    daysOfWeek: ['MO'],
    exceptions: [],
  };
}
