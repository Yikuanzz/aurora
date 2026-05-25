use serde::{Deserialize, Serialize};
use serde_json::json;
use futures_util::StreamExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ApiProvider {
    #[serde(rename = "openai")]
    OpenAI,
    #[serde(rename = "anthropic")]
    Anthropic,
}

impl ApiProvider {
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "anthropic" => ApiProvider::Anthropic,
            _ => ApiProvider::OpenAI,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

// ===== OpenAI Format =====

#[derive(Debug, Deserialize)]
struct OpenAIChoice {
    message: OpenAIMessage,
}

#[derive(Debug, Deserialize)]
struct OpenAIMessage {
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

// ===== Anthropic Format =====

#[derive(Debug, Deserialize)]
struct AnthropicContentBlock {
    text: String,
}

#[derive(Debug, Deserialize)]
struct AnthropicResponse {
    content: Vec<AnthropicContentBlock>,
}

// ===== Public API Functions =====

pub async fn chat_completion(
    api_key: String,
    base_url: String,
    model: String,
    provider: ApiProvider,
    messages: Vec<ChatMessage>,
) -> Result<String, String> {
    match provider {
        ApiProvider::OpenAI => openai_chat_completion(api_key, base_url, model, messages).await,
        ApiProvider::Anthropic => anthropic_chat_completion(api_key, base_url, model, messages).await,
    }
}

pub async fn chat_completion_stream(
    api_key: String,
    base_url: String,
    model: String,
    provider: ApiProvider,
    messages: Vec<ChatMessage>,
    on_chunk: impl FnMut(String) -> Result<(), String>,
) -> Result<(), String> {
    match provider {
        ApiProvider::OpenAI => {
            openai_chat_completion_stream(api_key, base_url, model, messages, on_chunk).await
        }
        ApiProvider::Anthropic => {
            anthropic_chat_completion_stream(api_key, base_url, model, messages, on_chunk).await
        }
    }
}

pub async fn list_models(
    api_key: String,
    base_url: String,
    provider: ApiProvider,
) -> Result<Vec<String>, String> {
    match provider {
        ApiProvider::OpenAI => openai_list_models(api_key, base_url).await,
        ApiProvider::Anthropic => anthropic_list_models(api_key, base_url).await,
    }
}

pub async fn test_connection(
    api_key: String,
    base_url: String,
    model: String,
    provider: ApiProvider,
) -> Result<String, String> {
    match provider {
        ApiProvider::OpenAI => openai_test_connection(api_key, base_url, model).await,
        ApiProvider::Anthropic => anthropic_test_connection(api_key, base_url, model).await,
    }
}

// ===== OpenAI Implementation =====

async fn openai_chat_completion(
    api_key: String,
    base_url: String,
    model: String,
    messages: Vec<ChatMessage>,
) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| e.to_string())?;

    let url = build_openai_chat_url(&base_url);

    let body = json!({
        "model": model,
        "messages": messages,
        "max_tokens": 2000,
        "temperature": 0.8,
    });

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误信息".to_string());
        return Err(format!("API 错误 ({}): {}", status, text));
    }

    let data: OpenAIResponse = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let content = data
        .choices
        .first()
        .map(|c| c.message.content.clone())
        .unwrap_or_default();

    Ok(content)
}

async fn openai_chat_completion_stream(
    api_key: String,
    base_url: String,
    model: String,
    messages: Vec<ChatMessage>,
    mut on_chunk: impl FnMut(String) -> Result<(), String>,
) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| e.to_string())?;

    let url = build_openai_chat_url(&base_url);

    let body = json!({
        "model": model,
        "messages": messages,
        "max_tokens": 2000,
        "temperature": 0.8,
        "stream": true,
    });

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误信息".to_string());
        return Err(format!("API 错误 ({}): {}", status, text));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| format!("流读取错误: {}", e))?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(pos) = buffer.find("\n\n") {
            let event = buffer[..pos].to_string();
            buffer = buffer[pos + 2..].to_string();

            for line in event.lines() {
                if let Some(data) = line.strip_prefix("data: ") {
                    let data = data.trim();
                    if data == "[DONE]" {
                        return Ok(());
                    }

                    if let Ok(json_val) = serde_json::from_str::<serde_json::Value>(data) {
                        if let Some(content) = json_val
                            .get("choices")
                            .and_then(|c| c.get(0))
                            .and_then(|c| c.get("delta"))
                            .and_then(|d| d.get("content"))
                            .and_then(|c| c.as_str())
                        {
                            if !content.is_empty() {
                                on_chunk(content.to_string())?;
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

async fn openai_list_models(api_key: String, base_url: String) -> Result<Vec<String>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let url = if base_url.ends_with("/v1") {
        format!("{}/models", base_url)
    } else if base_url.ends_with('/') {
        format!("{}v1/models", base_url)
    } else {
        format!("{}/v1/models", base_url)
    };

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误信息".to_string());
        return Err(format!("API 错误 ({}): {}", status, text));
    }

    #[derive(Debug, Deserialize)]
    struct ModelInfo {
        id: String,
    }
    #[derive(Debug, Deserialize)]
    struct ModelsResponse {
        data: Vec<ModelInfo>,
    }

    let data: ModelsResponse = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let models: Vec<String> = data.data.into_iter().map(|m| m.id).collect();
    Ok(models)
}

async fn openai_test_connection(
    api_key: String,
    base_url: String,
    model: String,
) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let url = build_openai_chat_url(&base_url);

    let body = json!({
        "model": model,
        "messages": [{"role": "user", "content": "Hi"}],
        "max_tokens": 5,
    });

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误信息".to_string());
        return Err(format!("API 错误 ({}): {}", status, text));
    }

    let data: OpenAIResponse = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let content = data
        .choices
        .first()
        .map(|c| c.message.content.clone())
        .unwrap_or_default();

    Ok(content)
}

// ===== Anthropic Implementation =====

fn build_anthropic_messages(messages: Vec<ChatMessage>) -> (Option<String>, Vec<ChatMessage>) {
    // Extract system message and filter it out from messages array
    let mut system_prompt: Option<String> = None;
    let mut filtered_messages: Vec<ChatMessage> = Vec::new();

    for msg in messages {
        if msg.role == "system" {
            system_prompt = Some(msg.content);
        } else {
            filtered_messages.push(msg);
        }
    }

    (system_prompt, filtered_messages)
}

async fn anthropic_chat_completion(
    api_key: String,
    base_url: String,
    model: String,
    messages: Vec<ChatMessage>,
) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| e.to_string())?;

    let url = build_anthropic_chat_url(&base_url);
    let (system_prompt, filtered_messages) = build_anthropic_messages(messages);

    let mut body = json!({
        "model": model,
        "messages": filtered_messages,
        "max_tokens": 2000,
    });

    if let Some(system) = system_prompt {
        body["system"] = json!(system);
    }

    let response = client
        .post(&url)
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误信息".to_string());
        return Err(format!("API 错误 ({}): {}", status, text));
    }

    let data: AnthropicResponse = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let content = data
        .content
        .first()
        .map(|c| c.text.clone())
        .unwrap_or_default();

    Ok(content)
}

async fn anthropic_chat_completion_stream(
    api_key: String,
    base_url: String,
    model: String,
    messages: Vec<ChatMessage>,
    mut on_chunk: impl FnMut(String) -> Result<(), String>,
) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| e.to_string())?;

    let url = build_anthropic_chat_url(&base_url);
    let (system_prompt, filtered_messages) = build_anthropic_messages(messages);

    let mut body = json!({
        "model": model,
        "messages": filtered_messages,
        "max_tokens": 2000,
        "stream": true,
    });

    if let Some(system) = system_prompt {
        body["system"] = json!(system);
    }

    let response = client
        .post(&url)
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误信息".to_string());
        return Err(format!("API 错误 ({}): {}", status, text));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| format!("流读取错误: {}", e))?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(pos) = buffer.find("\n\n") {
            let event = buffer[..pos].to_string();
            buffer = buffer[pos + 2..].to_string();

            // Parse SSE event: may contain event: and data: lines
            let mut event_type = String::new();
            let mut event_data = String::new();

            for line in event.lines() {
                if let Some(et) = line.strip_prefix("event: ") {
                    event_type = et.trim().to_string();
                } else if let Some(data) = line.strip_prefix("data: ") {
                    event_data = data.trim().to_string();
                }
            }

            if event_data == "[DONE]" {
                return Ok(());
            }

            // Anthropic uses event type + data
            if event_type == "content_block_delta" || event_data.contains("content_block_delta") {
                if let Ok(json_val) = serde_json::from_str::<serde_json::Value>(&event_data) {
                    if let Some(text) = json_val
                        .get("delta")
                        .and_then(|d| d.get("text"))
                        .and_then(|t| t.as_str())
                    {
                        if !text.is_empty() {
                            on_chunk(text.to_string())?;
                        }
                    }
                }
            } else if event_data.contains("message_stop") {
                return Ok(());
            }
        }
    }

    Ok(())
}

async fn anthropic_list_models(api_key: String, base_url: String) -> Result<Vec<String>, String> {
    // Anthropic has a models endpoint. Try it first.
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let url = if base_url.ends_with("/v1") {
        format!("{}/models", base_url)
    } else if base_url.ends_with('/') {
        format!("{}v1/models", base_url)
    } else {
        format!("{}/v1/models", base_url)
    };

    let response = client
        .get(&url)
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .send()
        .await;

    match response {
        Ok(resp) if resp.status().is_success() => {
            #[derive(Debug, Deserialize)]
            struct AnthropicModelInfo {
                id: String,
            }
            #[derive(Debug, Deserialize)]
            struct AnthropicModelsResponse {
                data: Vec<AnthropicModelInfo>,
            }

            let data: AnthropicModelsResponse = resp
                .json()
                .await
                .map_err(|e| format!("解析响应失败: {}", e))?;

            let models: Vec<String> = data.data.into_iter().map(|m| m.id).collect();
            if !models.is_empty() {
                return Ok(models);
            }
        }
        _ => {}
    }

    // Fallback to default Anthropic models
    Ok(vec![
        "claude-sonnet-4-6".to_string(),
        "claude-opus-4-6".to_string(),
        "claude-haiku-4-5-20251001".to_string(),
        "claude-3-5-sonnet-20241022".to_string(),
        "claude-3-opus-20240229".to_string(),
        "claude-3-haiku-20240307".to_string(),
    ])
}

async fn anthropic_test_connection(
    api_key: String,
    base_url: String,
    model: String,
) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let url = build_anthropic_chat_url(&base_url);

    let body = json!({
        "model": model,
        "messages": [{"role": "user", "content": "Hi"}],
        "max_tokens": 5,
    });

    let response = client
        .post(&url)
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误信息".to_string());
        return Err(format!("API 错误 ({}): {}", status, text));
    }

    let data: AnthropicResponse = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let content = data
        .content
        .first()
        .map(|c| c.text.clone())
        .unwrap_or_default();

    Ok(content)
}

// ===== URL Builders =====

fn build_openai_chat_url(base_url: &str) -> String {
    if base_url.ends_with("/v1") {
        format!("{}/chat/completions", base_url)
    } else if base_url.ends_with('/') {
        format!("{}v1/chat/completions", base_url)
    } else {
        format!("{}/v1/chat/completions", base_url)
    }
}

fn build_anthropic_chat_url(base_url: &str) -> String {
    if base_url.ends_with("/v1") {
        format!("{}/messages", base_url)
    } else if base_url.ends_with('/') {
        format!("{}v1/messages", base_url)
    } else {
        format!("{}/v1/messages", base_url)
    }
}

// ===== Embedding Generation =====

#[derive(Debug, Deserialize)]
struct EmbeddingResponse {
    data: Vec<EmbeddingData>,
}

#[derive(Debug, Deserialize)]
struct EmbeddingData {
    embedding: Vec<f32>,
}

pub async fn generate_embedding(
    api_key: String,
    base_url: String,
    text: String,
) -> Result<Vec<f32>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let url = if base_url.ends_with("/v1") {
        format!("{}/embeddings", base_url)
    } else if base_url.ends_with('/') {
        format!("{}v1/embeddings", base_url)
    } else {
        format!("{}/v1/embeddings", base_url)
    };

    let body = json!({
        "model": "text-embedding-3-small",
        "input": text,
    });

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("嵌入请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误信息".to_string());
        return Err(format!("嵌入 API 错误 ({}): {}", status, text));
    }

    let data: EmbeddingResponse = response
        .json()
        .await
        .map_err(|e| format!("解析嵌入响应失败: {}", e))?;

    data.data
        .first()
        .map(|d| d.embedding.clone())
        .ok_or_else(|| "嵌入响应为空".to_string())
}

// Cosine similarity between two vectors
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.is_empty() || b.is_empty() || a.len() != b.len() {
        return 0.0;
    }

    let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }

    dot_product / (norm_a * norm_b)
}
