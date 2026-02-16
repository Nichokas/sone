use tauri::State;

use crate::AppState;
use crate::SoneError;
use crate::tidal_api::{StreamInfo, TidalCredit, TidalLyrics, TidalTrack};

#[tauri::command(rename_all = "camelCase")]
pub async fn get_stream_url(state: State<'_, AppState>, track_id: u64, quality: String) -> Result<StreamInfo, SoneError> {
    log::debug!("[get_stream_url]: track_id={}, quality={}", track_id, quality);
    let mut client = state.tidal_client.lock().await;
    client.get_stream_url(track_id, &quality).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_track_lyrics(state: State<'_, AppState>, track_id: u64) -> Result<TidalLyrics, SoneError> {
    log::debug!("[get_track_lyrics]: track_id={}", track_id);
    let mut client = state.tidal_client.lock().await;
    client.get_track_lyrics(track_id).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_track_credits(state: State<'_, AppState>, track_id: u64) -> Result<Vec<TidalCredit>, SoneError> {
    log::debug!("[get_track_credits]: track_id={}", track_id);
    let mut client = state.tidal_client.lock().await;
    client.get_track_credits(track_id).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_track_radio(state: State<'_, AppState>, track_id: u64, limit: u32) -> Result<Vec<TidalTrack>, SoneError> {
    log::debug!("[get_track_radio]: track_id={}, limit={}", track_id, limit);
    let mut client = state.tidal_client.lock().await;
    client.get_track_radio(track_id, limit).await
}
