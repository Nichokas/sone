/**
 * usePlayback — full-subscription hook for components that need playback state + actions.
 *
 * Composes usePlaybackActions() (stable, zero-subscription action callbacks)
 * with useAtomValue() subscriptions for reactive state.
 *
 * Use usePlaybackActions directly if you only need to trigger actions
 * without subscribing to state changes.
 */

import { useAtomValue } from "jotai";
import { usePlaybackActions } from "./usePlaybackActions";
import {
  isPlayingAtom,
  currentTrackAtom,
  volumeAtom,
  queueAtom,
  historyAtom,
  streamInfoAtom,
} from "../atoms/playback";

export function usePlayback() {
  const actions = usePlaybackActions();

  return {
    ...actions,
    isPlaying: useAtomValue(isPlayingAtom),
    currentTrack: useAtomValue(currentTrackAtom),
    volume: useAtomValue(volumeAtom),
    queue: useAtomValue(queueAtom),
    history: useAtomValue(historyAtom),
    streamInfo: useAtomValue(streamInfoAtom),
  };
}
