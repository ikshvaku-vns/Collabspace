import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export interface ActivityLogEntry {
  _id: string;
  workspaceId: string;
  actorId: { _id: string; displayName: string; avatarUrl?: string };
  action: string;
  entityType: string;
  entityTitle: string;
  createdAt: string;
}

interface ActivityState {
  logs: ActivityLogEntry[];
  loading: boolean;
}

const initialState: ActivityState = {
  logs: [],
  loading: false,
};

export const fetchActivity = createAsyncThunk('activity/fetch', async (workspaceId?: string) => {
  const url = workspaceId ? `/activity/${workspaceId}` : '/activity';
  const res = await api.get(url);
  return res.data.logs;
});

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    clearActivity(state) { state.logs = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivity.pending, (state) => { state.loading = true; })
      .addCase(fetchActivity.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload;
      });
  },
});

export const { clearActivity } = activitySlice.actions;
export default activitySlice.reducer;
