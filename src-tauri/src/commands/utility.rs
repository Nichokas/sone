use crate::SoneError;

#[tauri::command]
pub async fn get_image_bytes(url: String) -> Result<Vec<u8>, SoneError> {
    log::debug!("[get_image_bytes]: url={}", url);
    let res = reqwest::get(&url).await?;
    let bytes = res.bytes().await?;
    Ok(bytes.to_vec())
}
