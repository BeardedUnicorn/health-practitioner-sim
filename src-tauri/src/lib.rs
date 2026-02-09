use serde::Serialize;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct RuntimeInfo {
    app_version: String,
    platform: String,
    tauri_version: String,
}

#[tauri::command]
fn runtime_info() -> RuntimeInfo {
    RuntimeInfo {
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        platform: std::env::consts::OS.to_string(),
        tauri_version: tauri::VERSION.to_string(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![runtime_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::runtime_info;

    #[test]
    fn runtime_info_has_expected_shape() {
        let info = runtime_info();
        assert!(!info.app_version.is_empty());
        assert!(!info.platform.is_empty());
        assert!(!info.tauri_version.is_empty());
    }

    #[test]
    fn runtime_info_is_stable_across_calls() {
        let first = runtime_info();
        let second = runtime_info();

        assert_eq!(first.app_version, second.app_version);
        assert_eq!(first.platform, second.platform);
        assert_eq!(first.tauri_version, second.tauri_version);
    }
}
