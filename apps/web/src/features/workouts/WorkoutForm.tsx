'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
} from '@mui/material';
import type { CreateWorkoutInput, UpdateWorkoutInput, WorkoutDetailResponse } from '@fitflow/shared';
import RecurrencePresetBuilder, { defaultRecurrencePreset } from './RecurrencePresetBuilder';
import { useWorkoutMutations } from './use-workouts';

interface WorkoutFormProps {
  workout?: WorkoutDetailResponse;
  onSuccess?: (workout: WorkoutDetailResponse) => void;
}

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function WorkoutForm({ workout, onSuccess }: WorkoutFormProps) {
  const { create, update } = useWorkoutMutations();
  const [title, setTitle] = useState(workout?.title ?? '');
  const [description, setDescription] = useState(workout?.description ?? '');
  const [location, setLocation] = useState(workout?.location ?? '');
  const [startAt, setStartAt] = useState(
    workout ? toLocalDatetimeValue(workout.startAt) : toLocalDatetimeValue(new Date().toISOString()),
  );
  const [maxCapacity, setMaxCapacity] = useState(workout?.maxCapacity?.toString() ?? '');
  const [recurrence, setRecurrence] = useState(defaultRecurrencePreset());
  const [error, setError] = useState<string | null>(null);

  const isPending = create.isPending || update.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: CreateWorkoutInput = {
      title,
      description: description || undefined,
      location: location || undefined,
      startAt: new Date(startAt).toISOString(),
      maxCapacity: maxCapacity ? Number(maxCapacity) : undefined,
      recurrencePreset: recurrence.type === 'none' ? undefined : recurrence,
    };

    try {
      if (workout) {
        const updated = await update.mutateAsync({
          id: workout.id,
          input: payload as UpdateWorkoutInput,
        });
        onSuccess?.(updated);
      } else {
        const created = await create.mutateAsync(payload);
        onSuccess?.(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workout');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TextField fullWidth required label="Title" margin="normal" value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextField fullWidth label="Description" margin="normal" multiline minRows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      <TextField fullWidth label="Location" margin="normal" value={location} onChange={(e) => setLocation(e.target.value)} />
      <TextField
        fullWidth
        required
        label="Start"
        type="datetime-local"
        margin="normal"
        InputLabelProps={{ shrink: true }}
        value={startAt}
        onChange={(e) => setStartAt(e.target.value)}
      />
      <TextField
        fullWidth
        label="Max capacity"
        type="number"
        margin="normal"
        value={maxCapacity}
        onChange={(e) => setMaxCapacity(e.target.value)}
      />
      <RecurrencePresetBuilder value={recurrence} onChange={setRecurrence} />
      <Button type="submit" variant="contained" fullWidth disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} /> : workout ? 'Save workout' : 'Create workout'}
      </Button>
    </Box>
  );
}
