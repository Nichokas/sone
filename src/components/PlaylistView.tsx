import { ChevronLeft, Play, Pause, Clock, Music } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAudioContext } from "../contexts/AudioContext";
import { getTidalImageUrl, type Track } from "../hooks/useAudio";
import TidalImage from "./TidalImage";

interface PlaylistViewProps {
  playlistId: string;
  playlistInfo?: {
    title: string;
    image?: string;
    description?: string;
    creatorName?: string;
    numberOfTracks?: number;
  };
  onBack: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function PlaylistView({
  playlistId,
  playlistInfo,
  onBack,
}: PlaylistViewProps) {
  const {
    getPlaylistTracks,
    playTrack,
    setQueueTracks,
    currentTrack,
    isPlaying,
    pauseTrack,
    resumeTrack,
    navigateToAlbum,
  } = useAudioContext();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPlaylist = async () => {
      setLoading(true);
      setError(null);

      try {
        const playlistTracks = await getPlaylistTracks(playlistId);
        if (!cancelled) {
          setTracks(playlistTracks);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to load playlist:", err);
          setError(err?.message || String(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPlaylist();

    return () => {
      cancelled = true;
    };
  }, [playlistId, getPlaylistTracks]);

  const trackIds = useMemo(() => new Set(tracks.map((track) => track.id)), [tracks]);

  const handlePlayTrack = async (track: Track, index: number) => {
    try {
      setQueueTracks(tracks.slice(index + 1));
      await playTrack(track);
    } catch (err) {
      console.error("Failed to play playlist track:", err);
    }
  };

  const handlePlayAll = async () => {
    if (tracks.length === 0) return;

    if (currentTrack && trackIds.has(currentTrack.id)) {
      if (isPlaying) {
        await pauseTrack();
      } else {
        await resumeTrack();
      }
      return;
    }

    try {
      setQueueTracks(tracks.slice(1));
      await playTrack(tracks[0]);
    } catch (err) {
      console.error("Failed to play playlist:", err);
    }
  };

  const isCurrentlyPlaying = (track: Track) =>
    currentTrack?.id === track.id && isPlaying;
  const isCurrentTrackRow = (track: Track) => currentTrack?.id === track.id;
  const playlistPlaying = !!(currentTrack && trackIds.has(currentTrack.id) && isPlaying);

  const displayTitle = playlistInfo?.title || "Playlist";
  const displayDescription = playlistInfo?.description;
  const displayCreator = playlistInfo?.creatorName || "You";
  const displayTrackCount =
    tracks.length > 0 ? tracks.length : (playlistInfo?.numberOfTracks ?? 0);

  if (loading) {
    return (
      <div className="flex-1 bg-gradient-to-b from-[#1a1a1a] to-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#00FFFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#a6a6a6] text-sm">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gradient-to-b from-[#1a1a1a] to-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-8">
          <Music size={48} className="text-[#535353]" />
          <p className="text-white font-semibold text-lg">
            Couldn't load playlist
          </p>
          <p className="text-[#a6a6a6] text-sm max-w-md">{error}</p>
          <button
            onClick={onBack}
            className="mt-2 px-6 py-2 bg-white text-black rounded-full text-sm font-bold hover:scale-105 transition-transform"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-b from-[#1a1a1a] to-[#121212] overflow-y-auto scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
      <div className="sticky top-0 z-20 px-6 py-4 flex items-center bg-[#121212]/50 backdrop-blur-xl">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-[#a6a6a6] hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="px-8 pb-8 flex items-end gap-7">
        <div className="w-[232px] h-[232px] flex-shrink-0 rounded-lg overflow-hidden shadow-2xl bg-[#282828] flex items-center justify-center">
          {playlistInfo?.image ? (
            <TidalImage
              src={getTidalImageUrl(playlistInfo.image, 640)}
              alt={displayTitle}
              type="playlist"
              className="w-full h-full"
            />
          ) : (
            <Music size={56} className="text-[#8a8a8a]" />
          )}
        </div>
        <div className="flex flex-col gap-2 pb-2 min-w-0">
          <span className="text-[12px] font-bold text-white/70 uppercase tracking-widest">
            Playlist
          </span>
          <h1 className="text-[48px] font-extrabold text-white leading-none tracking-tight line-clamp-2">
            {displayTitle}
          </h1>
          {displayDescription && (
            <p className="text-[14px] text-[#a6a6a6] mt-1 line-clamp-2 max-w-[800px]">
              {displayDescription}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[14px] text-[#a6a6a6] mt-2">
            <span className="text-white font-semibold">{displayCreator}</span>
            <span className="mx-1">•</span>
            <span>
              {displayTrackCount} song{displayTrackCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="px-8 py-5 flex items-center gap-5">
        <button
          onClick={handlePlayAll}
          className="w-14 h-14 bg-[#00FFFF] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:brightness-110 transition-all"
        >
          {playlistPlaying ? (
            <Pause size={24} fill="black" className="text-black" />
          ) : (
            <Play size={24} fill="black" className="text-black ml-1" />
          )}
        </button>
      </div>

      <div className="px-8 pb-8">
        <div className="grid grid-cols-[36px_1fr_minmax(140px,1fr)_72px] gap-4 px-4 py-3 border-b border-[#2a2a2a] text-[12px] text-[#a6a6a6] uppercase tracking-widest mb-2">
          <span className="text-right">#</span>
          <span>Title</span>
          <span>Album</span>
          <span className="flex justify-end">
            <Clock size={15} />
          </span>
        </div>

        <div className="flex flex-col">
          {tracks.map((track, index) => {
            const isActive = isCurrentTrackRow(track);
            const playing = isCurrentlyPlaying(track);

            return (
              <div
                key={`${track.id}-${index}`}
                onClick={() => handlePlayTrack(track, index)}
                className={`grid grid-cols-[36px_1fr_minmax(140px,1fr)_72px] gap-4 px-4 py-2.5 rounded-md cursor-pointer group transition-colors ${
                  isActive ? "bg-[#ffffff0a]" : "hover:bg-[#ffffff08]"
                }`}
              >
                <div className="flex items-center justify-end">
                  {playing ? (
                    <div className="flex items-center gap-[3px]">
                      <span className="w-[3px] h-3 bg-[#00FFFF] rounded-full animate-pulse" />
                      <span
                        className="w-[3px] h-4 bg-[#00FFFF] rounded-full animate-pulse"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="w-[3px] h-2.5 bg-[#00FFFF] rounded-full animate-pulse"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  ) : (
                    <>
                      <span
                        className={`text-[15px] tabular-nums group-hover:hidden ${
                          isActive ? "text-[#00FFFF]" : "text-[#a6a6a6]"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <Play
                        size={14}
                        fill="white"
                        className="text-white hidden group-hover:block"
                      />
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 flex-shrink-0 rounded bg-[#282828] overflow-hidden">
                    <TidalImage
                      src={getTidalImageUrl(track.album?.cover, 160)}
                      alt={track.album?.title || track.title}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <span
                      className={`text-[15px] font-medium truncate leading-snug ${
                        isActive ? "text-[#00FFFF]" : "text-white"
                      }`}
                    >
                      {track.title}
                    </span>
                    <span className="text-[13px] text-[#a6a6a6] truncate leading-snug group-hover:text-white transition-colors">
                      {track.artist?.name || "Unknown Artist"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center min-w-0">
                  <span
                    className="text-[14px] text-[#a6a6a6] truncate hover:text-white hover:underline transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (track.album?.id) {
                        navigateToAlbum(track.album.id, {
                          title: track.album.title,
                          cover: track.album.cover,
                          artistName: track.artist?.name,
                        });
                      }
                    }}
                  >
                    {track.album?.title || ""}
                  </span>
                </div>

                <div className="flex items-center justify-end text-[14px] text-[#a6a6a6] tabular-nums">
                  {formatDuration(track.duration)}
                </div>
              </div>
            );
          })}
        </div>

        {tracks.length === 0 && (
          <div className="py-16 text-center">
            <Music size={48} className="text-[#535353] mx-auto mb-4" />
            <p className="text-white font-semibold text-lg mb-2">
              This playlist is empty
            </p>
            <p className="text-[#a6a6a6] text-sm">
              Add tracks in Tidal to see them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
