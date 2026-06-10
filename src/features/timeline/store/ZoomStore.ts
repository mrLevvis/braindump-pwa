import { create } from 'zustand';
import { MIN_PX_PER_HOUR, MAX_PX_PER_HOUR, DEFAULT_PX_PER_HOUR } from '../getBlockGeometry';

interface ZoomState {
  pxPerHour: number;
  setPxPerHour: (next: number) => void;
}

export const useZoomStore = create<ZoomState>()((set) => ({
  pxPerHour: DEFAULT_PX_PER_HOUR,
  setPxPerHour: (next) =>
    set({ pxPerHour: Math.min(Math.max(next, MIN_PX_PER_HOUR), MAX_PX_PER_HOUR) }),
}));
