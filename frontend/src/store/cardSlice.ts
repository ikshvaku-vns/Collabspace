import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';

export interface Card {
  _id: string;
  workspaceId: string;
  title: string;
  description: string;
  column: 'todo' | 'inprogress' | 'done';
  assigneeId?: { _id: string; displayName: string; avatarUrl?: string };
  order: number;
  createdBy: { _id: string; displayName: string };
  createdAt: string;
  updatedAt: string;
}

interface CardState {
  cards: Card[];
  loading: boolean;
}

const initialState: CardState = {
  cards: [],
  loading: false,
};

export const fetchCards = createAsyncThunk('cards/fetchAll', async (workspaceId: string) => {
  const res = await api.get(`/cards/${workspaceId}`);
  return res.data.cards;
});

export const createCard = createAsyncThunk(
  'cards/create',
  async (data: { workspaceId: string; title: string; description?: string; column?: string }) => {
    const res = await api.post('/cards', data);
    return res.data.card;
  }
);

export const updateCard = createAsyncThunk(
  'cards/update',
  async ({ id, ...data }: { id: string; title?: string; description?: string; column?: string; order?: number; assigneeId?: string }) => {
    const res = await api.put(`/cards/${id}`, data);
    return res.data.card;
  }
);

export const deleteCard = createAsyncThunk('cards/delete', async (id: string) => {
  await api.delete(`/cards/${id}`);
  return id;
});

export const moveCard = createAsyncThunk(
  'cards/move',
  async ({ id, column, order }: { id: string; column: string; order: number }) => {
    const res = await api.patch(`/cards/${id}/move`, { column, order });
    return res.data.card;
  }
);

const cardSlice = createSlice({
  name: 'cards',
  initialState,
  reducers: {
    cardUpdatedFromSocket(state, action: PayloadAction<{ cardId: string; field: string; value: any }>) {
      const card = state.cards.find((c) => c._id === action.payload.cardId);
      if (card) {
        (card as any)[action.payload.field] = action.payload.value;
      }
    },
    cardMovedFromSocket(state, action: PayloadAction<{ cardId: string; toColumn: string; order: number }>) {
      const card = state.cards.find((c) => c._id === action.payload.cardId);
      if (card) {
        card.column = action.payload.toColumn as Card['column'];
        card.order = action.payload.order;
      }
    },
    clearCards(state) {
      state.cards = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCards.pending, (state) => { state.loading = true; })
      .addCase(fetchCards.fulfilled, (state, action) => {
        state.loading = false;
        state.cards = action.payload;
      })
      .addCase(createCard.fulfilled, (state, action) => {
        state.cards.push(action.payload);
      })
      .addCase(updateCard.fulfilled, (state, action) => {
        const idx = state.cards.findIndex((c) => c._id === action.payload._id);
        if (idx >= 0) state.cards[idx] = action.payload;
      })
      .addCase(deleteCard.fulfilled, (state, action) => {
        state.cards = state.cards.filter((c) => c._id !== action.payload);
      })
      .addCase(moveCard.fulfilled, (state, action) => {
        const idx = state.cards.findIndex((c) => c._id === action.payload._id);
        if (idx >= 0) state.cards[idx] = action.payload;
      });
  },
});

export const { cardUpdatedFromSocket, cardMovedFromSocket, clearCards } = cardSlice.actions;
export default cardSlice.reducer;
