import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';

export interface ChatMessageType {
  _id: string;
  workspaceId: string;
  userId: { _id: string; displayName: string; avatarUrl?: string };
  text: string;
  timestamp: string;
}

interface ChatState {
  messages: ChatMessageType[];
  loading: boolean;
}

const initialState: ChatState = {
  messages: [],
  loading: false,
};

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (workspaceId: string) => {
  const res = await api.get(`/chat/${workspaceId}`);
  return res.data.messages;
});

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessageType>) {
      // Avoid duplicates
      if (!state.messages.find((m) => m._id === action.payload._id)) {
        state.messages.push(action.payload);
      }
    },
    clearMessages(state) {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => { state.loading = true; })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      });
  },
});

export const { addMessage, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
