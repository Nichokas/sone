use tauri::State;

use crate::AppState;
use crate::SoneError;
use crate::tidal_api::{PaginatedTracks, TidalAlbumDetail, TidalPlaylist, TidalTrack};

#[tauri::command(rename_all = "camelCase")]
pub async fn get_user_playlists(state: State<'_, AppState>, user_id: u64) -> Result<Vec<TidalPlaylist>, SoneError> {
    log::debug!("[get_user_playlists]: user_id={}", user_id);
    let mut client = state.tidal_client.lock().await;
    let result = client.get_user_playlists(user_id).await;
    match &result {
        Ok(playlists) => log::debug!("[get_user_playlists]: got {} playlists", playlists.len()),
        Err(e) => log::debug!("[get_user_playlists]: failed: {}", e),
    }
    result
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_playlist_tracks(
    state: State<'_, AppState>,
    playlist_id: String,
) -> Result<Vec<TidalTrack>, SoneError> {
    log::debug!("[get_playlist_tracks]: playlist_id={}", playlist_id);
    let mut client = state.tidal_client.lock().await;
    client.get_playlist_tracks(&playlist_id).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_playlist_tracks_page(
    state: State<'_, AppState>,
    playlist_id: String,
    offset: u32,
    limit: u32,
) -> Result<PaginatedTracks, SoneError> {
    log::debug!("[get_playlist_tracks_page]: playlist_id={}, offset={}, limit={}", playlist_id, offset, limit);
    let mut client = state.tidal_client.lock().await;
    client.get_playlist_tracks_page(&playlist_id, offset, limit).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_favorite_playlists(state: State<'_, AppState>, user_id: u64) -> Result<Vec<TidalPlaylist>, SoneError> {
    log::debug!("[get_favorite_playlists]: user_id={}", user_id);
    let mut client = state.tidal_client.lock().await;
    client.get_favorite_playlists(user_id).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_favorite_albums(state: State<'_, AppState>, user_id: u64, limit: u32) -> Result<Vec<TidalAlbumDetail>, SoneError> {
    log::debug!("[get_favorite_albums]: user_id={}, limit={}", user_id, limit);
    let mut client = state.tidal_client.lock().await;
    client.get_favorite_albums(user_id, limit).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn create_playlist(
    state: State<'_, AppState>,
    user_id: u64,
    title: String,
    description: String,
) -> Result<TidalPlaylist, SoneError> {
    log::debug!("[create_playlist]: user_id={}, title={}", user_id, title);
    let client = state.tidal_client.lock().await;
    client.create_playlist(user_id, &title, &description).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn add_track_to_playlist(
    state: State<'_, AppState>,
    playlist_id: String,
    track_id: u64,
) -> Result<(), SoneError> {
    log::debug!("[add_track_to_playlist]: playlist_id={}, track_id={}", playlist_id, track_id);
    let client = state.tidal_client.lock().await;
    client.add_track_to_playlist(&playlist_id, track_id).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn remove_track_from_playlist(
    state: State<'_, AppState>,
    playlist_id: String,
    index: u32,
) -> Result<(), SoneError> {
    log::debug!("[remove_track_from_playlist]: playlist_id={}, index={}", playlist_id, index);
    let client = state.tidal_client.lock().await;
    client.remove_track_from_playlist(&playlist_id, index).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_favorite_tracks(
    state: State<'_, AppState>,
    user_id: u64,
    offset: u32,
    limit: u32,
) -> Result<PaginatedTracks, SoneError> {
    log::debug!("[get_favorite_tracks]: user_id={}, offset={}, limit={}", user_id, offset, limit);
    let mut client = state.tidal_client.lock().await;
    client.get_favorite_tracks(user_id, offset, limit).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_favorite_track_ids(state: State<'_, AppState>, user_id: u64) -> Result<Vec<u64>, SoneError> {
    log::debug!("[get_favorite_track_ids]: user_id={}", user_id);
    let client = state.tidal_client.lock().await;
    client.get_favorite_track_ids(user_id).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn is_track_favorited(state: State<'_, AppState>, user_id: u64, track_id: u64) -> Result<bool, SoneError> {
    log::debug!("[is_track_favorited]: user_id={}, track_id={}", user_id, track_id);
    let client = state.tidal_client.lock().await;
    client.is_track_favorited(user_id, track_id).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn add_favorite_track(state: State<'_, AppState>, user_id: u64, track_id: u64) -> Result<(), SoneError> {
    log::debug!("[add_favorite_track]: user_id={}, track_id={}", user_id, track_id);
    let client = state.tidal_client.lock().await;
    client.add_favorite_track(user_id, track_id).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn remove_favorite_track(state: State<'_, AppState>, user_id: u64, track_id: u64) -> Result<(), SoneError> {
    log::debug!("[remove_favorite_track]: user_id={}, track_id={}", user_id, track_id);
    let client = state.tidal_client.lock().await;
    client.remove_favorite_track(user_id, track_id).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn is_album_favorited(state: State<'_, AppState>, user_id: u64, album_id: u64) -> Result<bool, SoneError> {
    log::debug!("[is_album_favorited]: user_id={}, album_id={}", user_id, album_id);
    let client = state.tidal_client.lock().await;
    client.is_album_favorited(user_id, album_id).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn add_favorite_album(state: State<'_, AppState>, user_id: u64, album_id: u64) -> Result<(), SoneError> {
    log::debug!("[add_favorite_album]: user_id={}, album_id={}", user_id, album_id);
    let client = state.tidal_client.lock().await;
    client.add_favorite_album(user_id, album_id).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn remove_favorite_album(state: State<'_, AppState>, user_id: u64, album_id: u64) -> Result<(), SoneError> {
    log::debug!("[remove_favorite_album]: user_id={}, album_id={}", user_id, album_id);
    let client = state.tidal_client.lock().await;
    client.remove_favorite_album(user_id, album_id).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn add_favorite_playlist(state: State<'_, AppState>, user_id: u64, playlist_uuid: String) -> Result<(), SoneError> {
    log::debug!("[add_favorite_playlist]: user_id={}, playlist_uuid={}", user_id, playlist_uuid);
    let client = state.tidal_client.lock().await;
    client.add_favorite_playlist(user_id, &playlist_uuid).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn remove_favorite_playlist(state: State<'_, AppState>, user_id: u64, playlist_uuid: String) -> Result<(), SoneError> {
    log::debug!("[remove_favorite_playlist]: user_id={}, playlist_uuid={}", user_id, playlist_uuid);
    let client = state.tidal_client.lock().await;
    client.remove_favorite_playlist(user_id, &playlist_uuid).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn add_tracks_to_playlist(state: State<'_, AppState>, playlist_id: String, track_ids: Vec<u64>) -> Result<(), SoneError> {
    log::debug!("[add_tracks_to_playlist]: playlist_id={}, count={}", playlist_id, track_ids.len());
    let client = state.tidal_client.lock().await;
    client.add_tracks_to_playlist(&playlist_id, &track_ids).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_favorite_artists(state: State<'_, AppState>, user_id: u64, limit: u32) -> Result<Vec<crate::tidal_api::TidalArtistDetail>, SoneError> {
    log::debug!("[get_favorite_artists]: user_id={}, limit={}", user_id, limit);
    let meta = state.load_cache_meta();

    // Try cache
    if state.is_cache_fresh(meta.favorite_artists_ts) {
        if let Some(cached) = state.read_cache_file("favorite_artists.json") {
            if let Ok(artists) = serde_json::from_str::<Vec<crate::tidal_api::TidalArtistDetail>>(&cached) {
                return Ok(artists);
            }
        }
    }

    let mut client = state.tidal_client.lock().await;
    let artists = client.get_favorite_artists(user_id, limit).await?;

    // Cache
    if let Ok(json) = serde_json::to_string(&artists) {
        state.write_cache_file("favorite_artists.json", &json).ok();
        let mut meta = state.load_cache_meta();
        meta.favorite_artists_ts = crate::now_secs();
        state.save_cache_meta(&meta).ok();
    }

    Ok(artists)
}
