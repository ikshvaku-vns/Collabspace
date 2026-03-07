import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';

export interface WorkspaceMember {
  _id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}

export interface Workspace {
  _id: string;
  name: string;
  description: string;
  ownerId: WorkspaceMember;
  memberIds: WorkspaceMember[];
  inviteToken: string;
  createdAt: string;
  lastActiveAt: string;
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  error: string | null;
}

const initialState: WorkspaceState = {
  workspaces: [],
  activeWorkspace: null,
  loading: false,
  error: null,
};

export const fetchWorkspaces = createAsyncThunk('workspaces/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/workspaces');
    return res.data.workspaces;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch workspaces');
  }
});

export const createWorkspace = createAsyncThunk(
  'workspaces/create',
  async (data: { name: string; description?: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/workspaces', data);
      return res.data.workspace;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create workspace');
    }
  }
);

export const fetchWorkspace = createAsyncThunk('workspaces/fetchOne', async (id: string, { rejectWithValue }) => {
  try {
    const res = await api.get(`/workspaces/${id}`);
    return res.data.workspace;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch workspace');
  }
});

export const deleteWorkspace = createAsyncThunk('workspaces/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/workspaces/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to delete workspace');
  }
});

export const joinWorkspace = createAsyncThunk('workspaces/join', async (inviteToken: string, { rejectWithValue }) => {
  try {
    const res = await api.post(`/workspaces/join/${inviteToken}`);
    return res.data.workspace;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to join workspace');
  }
});

const workspaceSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    setActiveWorkspace(state, action: PayloadAction<Workspace | null>) {
      state.activeWorkspace = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => { state.loading = true; })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.workspaces = action.payload;
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.workspaces.unshift(action.payload);
      })
      .addCase(fetchWorkspace.fulfilled, (state, action) => {
        state.activeWorkspace = action.payload;
      })
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.workspaces = state.workspaces.filter((w) => w._id !== action.payload);
      })
      .addCase(joinWorkspace.fulfilled, (state, action) => {
        const exists = state.workspaces.find((w) => w._id === action.payload._id);
        if (!exists) state.workspaces.unshift(action.payload);
      });
  },
});

export const { setActiveWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
