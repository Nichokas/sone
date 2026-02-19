import {
  Home,
  Compass,
  Library,
  Heart,
  Music,
} from "lucide-react";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import SidebarSkeleton from "./SidebarSkeleton";
import { getUserPlaylists, getFavoriteAlbums, getFavoriteMixes } from "../api/tidal";
import { useNavigation } from "../hooks/useNavigation";
import { useAuth } from "../hooks/useAuth";
import { getTidalImageUrl, type MediaItemType, type Playlist } from "../types";
import TidalImage from "./TidalImage";
import MediaContextMenu from "./MediaContextMenu";
import { useState, useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";
import { favoritePlaylistsAtom } from "../atoms/playlists";

export default function Sidebar() {
  const {
    navigateToPlaylist,
    navigateToAlbum,
    navigateToMix,
    navigateToFavorites,
    navigateHome,
    navigateToExplore,
    currentView,
  } = useNavigation();
  const { authTokens } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"playlists" | "albums" | "mixes">("playlists");

  // Playlists: paginate user playlists, merge in favorites from atom (loaded at boot)
  const favoritePlaylists = useAtomValue(favoritePlaylistsAtom);

  const playlistFetch = useCallback(async (offset: number, limit: number) => {
    if (!authTokens?.user_id) return { items: [], totalNumberOfItems: 0 };
    return getUserPlaylists(authTokens.user_id, offset, limit);
  }, [authTokens?.user_id]);

  const {
    items: userPlaylistItems,
    isInitialLoading: playlistsLoading,
    isLoadingMore: playlistsLoadingMore,
    hasMore: playlistsHasMore,
    sentinelRef: playlistsSentinelRef,
  } = useInfiniteScroll({
    fetchPage: playlistFetch,
    pageSize: 20,
    enabled: activeFilter === "playlists" && !!authTokens?.user_id,
  });

  // Merge: user playlists first, then append non-duplicate favorites
  const allPlaylists = useMemo(() => {
    const seen = new Set<string>();
    const merged: Playlist[] = [];
    for (const p of userPlaylistItems) {
      if (!seen.has(p.uuid)) { seen.add(p.uuid); merged.push(p); }
    }
    for (const p of favoritePlaylists) {
      if (!seen.has(p.uuid)) { seen.add(p.uuid); merged.push(p); }
    }
    return merged;
  }, [userPlaylistItems, favoritePlaylists]);

  // Albums
  const albumFetch = useCallback(async (offset: number, limit: number) => {
    if (!authTokens?.user_id) return { items: [], totalNumberOfItems: 0 };
    return getFavoriteAlbums(authTokens.user_id, offset, limit);
  }, [authTokens?.user_id]);

  const {
    items: favoriteAlbumsList,
    isInitialLoading: albumsLoading,
    isLoadingMore: albumsLoadingMore,
    hasMore: albumsHasMore,
    sentinelRef: albumsSentinelRef,
  } = useInfiniteScroll({
    fetchPage: albumFetch,
    pageSize: 20,
    enabled: activeFilter === "albums" && !!authTokens?.user_id,
  });

  // Mixes
  const mixFetch = useCallback(async (offset: number, limit: number) => {
    return getFavoriteMixes(offset, limit);
  }, []);

  const {
    items: favoriteMixesList,
    isInitialLoading: mixesLoading,
    isLoadingMore: mixesLoadingMore,
    hasMore: mixesHasMore,
    sentinelRef: mixesSentinelRef,
  } = useInfiniteScroll({
    fetchPage: mixFetch,
    pageSize: 20,
    enabled: activeFilter === "mixes" && !!authTokens?.user_id,
  });

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    item: MediaItemType;
    position: { x: number; y: number };
  } | null>(null);

  const handlePlaylistContextMenu = useCallback(
    (e: React.MouseEvent, playlist: Playlist) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        item: {
          type: "playlist",
          uuid: playlist.uuid,
          title: playlist.title,
          image: playlist.image,
          creatorName: playlist.creator?.name || (playlist.creator?.id === 0 ? "TIDAL" : undefined),
        },
        position: { x: e.clientX, y: e.clientY },
      });
    },
    []
  );

  const userId = authTokens?.user_id;

  const isOwnPlaylist = (playlist: Playlist) => {
    if (!userId) return true; // fallback: assume own if we don't know
    return playlist.creator?.id === userId;
  };

  /** Resolve a display name for the playlist creator */
  const getCreatorName = (playlist: Playlist) => {
    if (playlist.creator?.name) return playlist.creator.name;
    // Tidal editorial playlists have creator.id === 0 but no name
    if (playlist.creator?.id === 0) return "TIDAL";
    return undefined;
  };

  const handlePlaylistClick = (playlist: Playlist) => {
    const own = isOwnPlaylist(playlist);
    navigateToPlaylist(playlist.uuid, {
      title: playlist.title,
      image: playlist.image,
      description: playlist.description,
      creatorName: own ? undefined : getCreatorName(playlist),
      numberOfTracks: playlist.numberOfTracks,
      isUserPlaylist: own,
    });
  };

  return (
    <div
      className={`sidebar h-full bg-th-sidebar flex flex-col border-r border-th-border-subtle transition-[width,min-width,max-width] duration-300 ease-in-out flex-shrink-0 ${
        isCollapsed ? "w-[60px]" : "w-[280px] min-w-[240px] max-w-[340px]"
      }`}
    >
      {/* Navigation */}
      <nav className="px-2 pt-3 space-y-0.5">
        <button
          onClick={navigateHome}
          className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-md transition-colors duration-150 group ${
            currentView.type === "home"
              ? "text-white bg-white/[0.08]"
              : "text-th-text-secondary hover:text-white hover:bg-th-border-subtle"
          } ${isCollapsed ? "justify-center px-0" : ""}`}
          title="Home"
        >
          <Home size={20} strokeWidth={2} />
          {!isCollapsed && <span className="font-semibold text-sm">Home</span>}
        </button>
        <button
          onClick={navigateToExplore}
          className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-md transition-colors duration-150 group ${
            currentView.type === "explore" || currentView.type === "explorePage"
              ? "text-white bg-white/[0.08]"
              : "text-th-text-secondary hover:text-white hover:bg-th-border-subtle"
          } ${isCollapsed ? "justify-center px-0" : ""}`}
          title="Explore"
        >
          <Compass size={20} strokeWidth={2} />
          {!isCollapsed && (
            <span className="font-semibold text-sm">Explore</span>
          )}
        </button>
      </nav>

      {/* Library Header */}
      <div className="flex-1 flex flex-col min-h-0">
        <div
          className={`px-2 py-1.5 flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center gap-3 px-2.5 py-2 text-th-text-secondary hover:text-white transition-colors duration-150 group ${
              isCollapsed ? "justify-center w-full px-0" : ""
            }`}
          >
            <Library size={20} />
            {!isCollapsed && (
              <span className="font-semibold text-sm">Your Library</span>
            )}
          </button>
        </div>

        {/* Filter Pills */}
        {!isCollapsed && (
          <div className="px-2 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
            {(["playlists", "albums", "mixes"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                  activeFilter === tab
                    ? "bg-th-accent/15 text-th-accent"
                    : "bg-white/[0.07] hover:bg-th-inset text-th-text-secondary"
                }`}
              >
                {tab === "playlists" ? "Playlists" : tab === "albums" ? "Albums" : "Mixes"}
              </button>
            ))}
          </div>
        )}

        {/* Library List */}
        <div className="flex-1 overflow-y-auto px-1.5 pb-2 custom-scrollbar">
          {activeFilter === "playlists" ? (
            /* Playlists view */
            playlistsLoading ? (
              <SidebarSkeleton count={5} />
            ) : allPlaylists.length === 0 ? (
              <div
                className={`px-3 py-8 text-center ${isCollapsed ? "hidden" : ""}`}
              >
                <p className="text-th-text-muted text-sm">
                  Create your first playlist
                </p>
                <button className="mt-4 px-4 py-2 bg-white text-black rounded-full text-sm font-bold hover:scale-105 transition-transform">
                  Create playlist
                </button>
              </div>
            ) : (
              <div className="space-y-px">
                {/* Loved Tracks - pinned at top */}
                <button
                  onClick={navigateToFavorites}
                  className={`w-full flex items-center gap-2.5 px-1.5 py-2 rounded-md transition-colors duration-150 group ${
                    currentView.type === "favorites"
                      ? "bg-white/[0.08]"
                      : "hover:bg-th-border-subtle"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title="Loved Tracks"
                >
                  <div
                    className={`shrink-0 overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#450af5] via-[#8e2de2] to-[#00d2ff] ${
                      isCollapsed ? "w-10 h-10 rounded" : "w-10 h-10 rounded"
                    }`}
                  >
                    <Heart size={15} className="text-white" fill="white" />
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-[13px] font-medium text-white truncate leading-tight">
                        Loved Tracks
                      </div>
                      <div className="text-[11px] text-th-text-faint truncate leading-tight mt-0.5">
                        Collection
                      </div>
                    </div>
                  )}
                </button>

                {allPlaylists.map((playlist) => {
                  const own = isOwnPlaylist(playlist);
                  const trackCount = playlist.numberOfTracks;

                  // Build subtitle: "N tracks" for own playlists, "Creator name · N tracks" for public
                  const creatorLabel = !own ? getCreatorName(playlist) : undefined;
                  let subtitle = "";
                  if (creatorLabel) {
                    subtitle = creatorLabel;
                    if (trackCount != null) {
                      subtitle += ` \u00B7 ${trackCount} track${trackCount !== 1 ? "s" : ""}`;
                    }
                  } else if (trackCount != null) {
                    subtitle = `${trackCount} track${trackCount !== 1 ? "s" : ""}`;
                  } else {
                    subtitle = "Playlist";
                  }

                  return (
                    <button
                      key={playlist.uuid}
                      onClick={() => handlePlaylistClick(playlist)}
                      onContextMenu={(e) => handlePlaylistContextMenu(e, playlist)}
                      className={`w-full flex items-center gap-2.5 px-1.5 py-2 rounded-md transition-colors duration-150 group ${
                        currentView.type === "playlist" &&
                        currentView.playlistId === playlist.uuid
                          ? "bg-white/[0.08]"
                          : "hover:bg-th-border-subtle"
                      } ${isCollapsed ? "justify-center" : ""}`}
                      title={playlist.title}
                    >
                      <div
                        className={`bg-th-surface-hover shrink-0 overflow-hidden rounded ${
                          isCollapsed ? "w-10 h-10" : "w-10 h-10"
                        }`}
                      >
                        <TidalImage
                          src={getTidalImageUrl(playlist.image, 80)}
                          alt={playlist.title}
                          type="playlist"
                        />
                      </div>

                      {!isCollapsed && (
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-[14px] font-medium text-white truncate leading-snug">
                            {playlist.title}
                          </div>
                          <div className="text-[12px] text-th-text-faint truncate leading-snug mt-0.5">
                            {subtitle}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
                {playlistsHasMore && <div ref={playlistsSentinelRef} />}
                {playlistsLoadingMore && <SidebarSkeleton count={2} />}
              </div>
            )
          ) : activeFilter === "albums" ? (
            /* Albums view */
            albumsLoading ? (
              <SidebarSkeleton count={5} />
            ) : favoriteAlbumsList.length === 0 ? (
              <div className={`px-3 py-8 text-center ${isCollapsed ? "hidden" : ""}`}>
                <p className="text-th-text-muted text-sm">No favorite albums yet</p>
              </div>
            ) : (
              <div className="space-y-px">
                {favoriteAlbumsList.map((album) => (
                  <button
                    key={album.id}
                    onClick={() =>
                      navigateToAlbum(album.id, {
                        title: album.title,
                        cover: album.cover,
                        artistName: album.artist?.name,
                      })
                    }
                    className={`w-full flex items-center gap-2.5 px-1.5 py-2 rounded-md transition-colors duration-150 group ${
                      currentView.type === "album" &&
                      currentView.albumId === album.id
                        ? "bg-white/[0.08]"
                        : "hover:bg-th-border-subtle"
                    } ${isCollapsed ? "justify-center" : ""}`}
                    title={album.title}
                  >
                    <div
                      className={`bg-th-surface-hover shrink-0 overflow-hidden rounded ${
                        isCollapsed ? "w-10 h-10" : "w-10 h-10"
                      }`}
                    >
                      {album.cover ? (
                        <TidalImage
                          src={getTidalImageUrl(album.cover, 80)}
                          alt={album.title}
                          type="album"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music size={16} className="text-gray-600" />
                        </div>
                      )}
                    </div>

                    {!isCollapsed && (
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-[14px] font-medium text-white truncate leading-snug">
                          {album.title}
                        </div>
                        <div className="text-[12px] text-th-text-faint truncate leading-snug mt-0.5">
                          {album.artist?.name || "Unknown Artist"}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
                {albumsHasMore && <div ref={albumsSentinelRef} />}
                {albumsLoadingMore && <SidebarSkeleton count={2} />}
              </div>
            )
          ) : (
            /* Mixes view */
            mixesLoading ? (
              <SidebarSkeleton count={5} />
            ) : favoriteMixesList.length === 0 ? (
              <div className={`px-3 py-8 text-center ${isCollapsed ? "hidden" : ""}`}>
                <p className="text-th-text-muted text-sm">No favorite mixes yet</p>
              </div>
            ) : (
              <div className="space-y-px">
                {favoriteMixesList.map((mix) => (
                  <button
                    key={mix.id}
                    onClick={() =>
                      navigateToMix(mix.id, {
                        title: mix.title,
                        image: mix.images?.MEDIUM?.url,
                        subtitle: mix.subTitle,
                      })
                    }
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({
                        item: {
                          type: "mix",
                          mixId: mix.id,
                          title: mix.title,
                          image: mix.images?.MEDIUM?.url,
                          subtitle: mix.subTitle,
                        },
                        position: { x: e.clientX, y: e.clientY },
                      });
                    }}
                    className={`w-full flex items-center gap-2.5 px-1.5 py-2 rounded-md transition-colors duration-150 group ${
                      currentView.type === "mix" &&
                      currentView.mixId === mix.id
                        ? "bg-white/[0.08]"
                        : "hover:bg-th-border-subtle"
                    } ${isCollapsed ? "justify-center" : ""}`}
                    title={mix.title}
                  >
                    <div
                      className={`bg-th-surface-hover shrink-0 overflow-hidden rounded ${
                        isCollapsed ? "w-10 h-10" : "w-10 h-10"
                      }`}
                    >
                      {mix.images?.SMALL?.url ? (
                        <img
                          src={mix.images.SMALL.url}
                          alt={mix.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music size={16} className="text-gray-600" />
                        </div>
                      )}
                    </div>

                    {!isCollapsed && (
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-[14px] font-medium text-white truncate leading-snug">
                          {mix.title}
                        </div>
                        <div className="text-[12px] text-th-text-faint truncate leading-snug mt-0.5">
                          {mix.subTitle || "Mix"}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
                {mixesHasMore && <div ref={mixesSentinelRef} />}
                {mixesLoadingMore && <SidebarSkeleton count={2} />}
              </div>
            )
          )}
        </div>
      </div>

      {/* Media context menu */}
      {contextMenu && (
        <MediaContextMenu
          item={contextMenu.item}
          cursorPosition={contextMenu.position}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
