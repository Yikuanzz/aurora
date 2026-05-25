use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct TavilySearchRequest {
    pub query: String,
    pub search_depth: Option<String>,
    pub max_results: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TavilySearchResult {
    pub title: String,
    pub url: String,
    pub content: String,
    pub score: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TavilySearchResponse {
    pub query: String,
    pub answer: Option<String>,
    pub results: Vec<TavilySearchResult>,
    pub response_time: String,
}

pub async fn search(
    api_key: String,
    req: TavilySearchRequest,
) -> Result<TavilySearchResponse, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let body = serde_json::json!({
        "query": req.query,
        "search_depth": req.search_depth.unwrap_or_else(|| "basic".to_string()),
        "max_results": req.max_results.unwrap_or(5),
        "include_answer": true,
        "include_raw_content": false,
        "include_images": false,
    });

    let response = client
        .post("https://api.tavily.com/search")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Tavily 请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误信息".to_string());
        return Err(format!("Tavily API 错误 ({}): {}", status, text));
    }

    let data: TavilySearchResponse = response
        .json()
        .await
        .map_err(|e| format!("解析 Tavily 响应失败: {}", e))?;

    Ok(data)
}
