use serde::Serialize;
use tauri::State;

use crate::AppState;
use crate::SoneError;
use crate::now_secs;
use crate::tidal_api::{HomePageResponse, PaginatedTracks, TidalAlbumDetail, TidalArtistDetail, TidalTrack};

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HomePageCached {
    home: HomePageResponse,
    is_stale: bool,
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_album_detail(state: State<'_, AppState>, album_id: u64) -> Result<TidalAlbumDetail, SoneError> {
    log::debug!("[get_album_detail]: album_id={}", album_id);
    let mut client = state.tidal_client.lock().await;
    client.get_album_detail(album_id).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_album_tracks(
    state: State<'_, AppState>,
    album_id: u64,
    offset: u32,
    limit: u32,
) -> Result<PaginatedTracks, SoneError> {
    log::debug!("[get_album_tracks]: album_id={}, offset={}, limit={}", album_id, offset, limit);
    let mut client = state.tidal_client.lock().await;
    client.get_album_tracks(album_id, offset, limit).await
}

#[tauri::command]
pub async fn get_home_page(state: State<'_, AppState>) -> Result<HomePageCached, SoneError> {
    log::debug!("[get_home_page]");
    let meta = state.load_cache_meta();

    // Try to serve from cache first
    if meta.home_page_ts > 0 {
        if let Some(cached) = state.read_cache_file("home_page.json") {
            if let Ok(home) = serde_json::from_str::<HomePageResponse>(&cached) {
                let is_stale = !state.is_cache_fresh(meta.home_page_ts);
                return Ok(HomePageCached { home, is_stale });
            }
        }
    }

    // No valid cache — fetch fresh
    let mut client = state.tidal_client.lock().await;
    let home = client.get_home_page().await?;

    // Cache the result
    if let Ok(json) = serde_json::to_string(&home) {
        state.write_cache_file("home_page.json", &json).ok();
        let mut meta = state.load_cache_meta();
        meta.home_page_ts = now_secs();
        state.save_cache_meta(&meta).ok();
    }

    Ok(HomePageCached { home, is_stale: false })
}

#[tauri::command]
pub async fn refresh_home_page(state: State<'_, AppState>) -> Result<HomePageResponse, SoneError> {
    log::debug!("[refresh_home_page]");
    let mut client = state.tidal_client.lock().await;
    let home = client.get_home_page().await?;

    // Update cache
    if let Ok(json) = serde_json::to_string(&home) {
        state.write_cache_file("home_page.json", &json).ok();
        let mut meta = state.load_cache_meta();
        meta.home_page_ts = now_secs();
        state.save_cache_meta(&meta).ok();
    }

    Ok(home)
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_page_section(state: State<'_, AppState>, api_path: String) -> Result<HomePageResponse, SoneError> {
    log::debug!("[get_page_section]: api_path={}", api_path);
    let mut client = state.tidal_client.lock().await;
    client.get_page(&api_path).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_mix_items(state: State<'_, AppState>, mix_id: String) -> Result<Vec<TidalTrack>, SoneError> {
    log::debug!("[get_mix_items]: mix_id={}", mix_id);
    let mut client = state.tidal_client.lock().await;
    client.get_mix_items(&mix_id).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_artist_detail(state: State<'_, AppState>, artist_id: u64) -> Result<TidalArtistDetail, SoneError> {
    log::debug!("[get_artist_detail]: artist_id={}", artist_id);
    let mut client = state.tidal_client.lock().await;
    client.get_artist_detail(artist_id).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_artist_top_tracks(state: State<'_, AppState>, artist_id: u64, limit: u32) -> Result<Vec<TidalTrack>, SoneError> {
    log::debug!("[get_artist_top_tracks]: artist_id={}, limit={}", artist_id, limit);
    let mut client = state.tidal_client.lock().await;
    client.get_artist_top_tracks(artist_id, limit).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_artist_albums(state: State<'_, AppState>, artist_id: u64, limit: u32) -> Result<Vec<TidalAlbumDetail>, SoneError> {
    log::debug!("[get_artist_albums]: artist_id={}, limit={}", artist_id, limit);
    let mut client = state.tidal_client.lock().await;
    client.get_artist_albums(artist_id, limit).await
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_artist_bio(state: State<'_, AppState>, artist_id: u64) -> Result<String, SoneError> {
    log::debug!("[get_artist_bio]: artist_id={}", artist_id);
    let mut client = state.tidal_client.lock().await;
    client.get_artist_bio(artist_id).await
}

/// Debug command: returns the raw JSON structure of multiple page endpoints
/// so we can see what format Tidal is using and what sections are available.
#[tauri::command]
pub async fn debug_home_page_raw(state: State<'_, AppState>) -> Result<String, SoneError> {
    let access_token = {
        let client = state.tidal_client.lock().await;
        let tokens = client.tokens.as_ref().ok_or(SoneError::NotAuthenticated)?;
        tokens.access_token.clone()
    };

    let http = reqwest::Client::new();
    let mut summary = String::new();

    let endpoints = [
        "pages/home",
        "pages/for_you",
        "pages/my_collection_recently_played",
        "pages/my_collection_my_mixes",
        "pages/explore",
        "pages/suggested_new_tracks_for_you",
        "pages/suggested_new_albums_for_you",
        "pages/show/essential_album",
    ];

    for endpoint in &endpoints {
        summary.push_str(&format!("=== {} ===\n", endpoint));

        let response = http
            .get(format!("https://api.tidal.com/v1/{}", endpoint))
            .header("Authorization", format!("Bearer {}", access_token))
            .query(&[("countryCode", "US"), ("deviceType", "BROWSER"), ("locale", "en_US")])
            .send()
            .await;

        match response {
            Ok(resp) => {
                let status = resp.status();
                if !status.is_success() {
                    summary.push_str(&format!("  ERROR: status {}\n\n", status));
                    continue;
                }
                let body = resp.text().await.unwrap_or_default();
                let json: serde_json::Value = match serde_json::from_str(&body) {
                    Ok(j) => j,
                    Err(e) => { summary.push_str(&format!("  PARSE ERROR: {}\n\n", e)); continue; }
                };

                summary.push_str(&format!("  Top-level keys: {:?}\n",
                    json.as_object().map(|o| o.keys().collect::<Vec<_>>()).unwrap_or_default()));

                // V1
                if let Some(rows) = json.get("rows").and_then(|r| r.as_array()) {
                    summary.push_str(&format!("  FORMAT: V1 (rows), {} rows\n", rows.len()));
                    for (i, row) in rows.iter().enumerate() {
                        if let Some(modules) = row.get("modules").and_then(|m| m.as_array()) {
                            for module in modules {
                                let mtype = module.get("type").and_then(|t| t.as_str()).unwrap_or("?");
                                let title = module.get("title").and_then(|t| t.as_str()).unwrap_or("(no title)");
                                let item_count = module.get("pagedList")
                                    .and_then(|pl| pl.get("items"))
                                    .and_then(|i| i.as_array())
                                    .map(|a| a.len())
                                    .or_else(|| module.get("highlights").and_then(|h| h.as_array()).map(|a| a.len()))
                                    .unwrap_or(0);
                                let has_more = module.get("showMore").is_some();
                                summary.push_str(&format!("    Row {}: type={:<30} title=\"{}\" items={} more={}\n",
                                    i, mtype, title, item_count, has_more));
                            }
                        }
                    }
                }

                // V2
                if let Some(items) = json.get("items").and_then(|i| i.as_array()) {
                    summary.push_str(&format!("  FORMAT: V2 (items), {} sections\n", items.len()));
                    for (i, item) in items.iter().enumerate() {
                        let stype = item.get("type").and_then(|t| t.as_str()).unwrap_or("?");
                        let title = item.get("title")
                            .and_then(|t| t.as_str())
                            .or_else(|| item.get("titleTextInfo").and_then(|ti| ti.get("text")).and_then(|t| t.as_str()))
                            .unwrap_or("(no title)");
                        let item_count = item.get("items").and_then(|i| i.as_array()).map(|a| a.len()).unwrap_or(0);
                        let has_view_all = item.get("viewAll").is_some() || item.get("showMore").is_some();
                        let first_type = item.get("items").and_then(|i| i.as_array())
                            .and_then(|a| a.first()).and_then(|f| f.get("type")).and_then(|t| t.as_str()).unwrap_or("?");
                        summary.push_str(&format!("    Sec {}: type={:<35} title=\"{}\" items={} first={} more={}\n",
                            i, stype, title, item_count, first_type, has_view_all));
                    }
                }
            }
            Err(e) => {
                summary.push_str(&format!("  FETCH ERROR: {}\n", e));
            }
        }
        summary.push('\n');
    }

    Ok(summary)
}
