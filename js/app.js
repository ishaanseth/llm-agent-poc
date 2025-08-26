let chatHistory = [];
let currentProvider = null;

// Create hidden sandbox iframe for JS execution
function createSandbox() {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  return iframe;
}
const sandbox = createSandbox();

async function initProvider() {
  const model = document.getElementById("model-picker").value;
  document.getElementById("send-btn").disabled = true;

  if (model === "echo") {
    currentProvider = {
      chat: async (messages) => {
        const last = messages[messages.length - 1].content;
        return { choices: [{ message: { content: "Echo: " + last } }] };
      }
    };
    appendAlert("✅ Echo provider ready", "success");
    document.getElementById("send-btn").disabled = false;
  } 
  else if (model.startsWith("aipipe:")) {
    let aipipeKey = localStorage.getItem("AIPIPE_API_KEY");
    if (!aipipeKey) {
      const key = prompt("Enter your AI Pipe API Key:");
      if (!key) {
        appendAlert("❌ No API key provided", "danger");
        return;
      }
      localStorage.setItem("AIPIPE_API_KEY", key);
      aipipeKey = key;
    }

    const modelName = model.replace("aipipe:", "");

    currentProvider = {
      chat: async (messages) => {
        const resp = await fetch("https://aipipe.org/openrouter/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${aipipeKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: messages,
            tools: [
              {
                type: "function",
                function: {
                  name: "search",
                  description: "Search Google for information",
                  parameters: {
                    type: "object",
                    properties: { query: { type: "string" } },
                    required: ["query"]
                  }
                }
              },
              {
                type: "function",
                function: {
                  name: "aiPipeCall",
                  description: "Call another AI Pipe model",
                  parameters: {
                    type: "object",
                    properties: {
                      model: { type: "string" },
                      prompt: { type: "string" }
                    },
                    required: ["model", "prompt"]
                  }
                }
              },
              {
                type: "function",
                function: {
                  name: "runJS",
                  description: "Run JavaScript code securely",
                  parameters: {
                    type: "object",
                    properties: { code: { type: "string" } },
                    required: ["code"]
                  }
                }
              }
            ]
          })
        });
        const data = await resp.json();
        if (data.error) throw new Error(data.error.message);
        return data;
      }
    };
    appendAlert(`✅ AI Pipe provider ready (${modelName})`, "success");
    document.getElementById("send-btn").disabled = false;
  }
}

async function sendMessage() {
  const inputBox = document.getElementById("user-input");
  const message = inputBox.value.trim();
  if (!message) return;
  if (!currentProvider) {
    appendAlert("❌ Provider not ready yet!", "danger");
    return;
  }

  appendMessage("You", message, "user-msg");
  inputBox.value = "";
  chatHistory.push({ role: "user", content: message });

  await agentLoop();
}

async function agentLoop(maxSteps = 5) {
  for (let step = 0; step < maxSteps; step++) {
    const response = await currentProvider.chat(chatHistory);
    const assistantMessage = response.choices[0].message;
    chatHistory.push(assistantMessage);

    let madeToolCall = false;

    if (assistantMessage.tool_calls) {
      madeToolCall = true;
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.function.name === "search") {
          const query = JSON.parse(toolCall.function.arguments).query;
          appendMessage("Agent", `Requested search for: ${query}`, "agent-msg");
          const results = await handleGoogleSearch(query);
          chatHistory.push({ role: "tool", tool_call_id: toolCall.id, content: results });
        }
        else if (toolCall.function.name === "aiPipeCall") {
          const { model, prompt } = JSON.parse(toolCall.function.arguments);
          appendMessage("Agent", `Delegating to AI Pipe model: ${model}`, "agent-msg");
          const results = await handleAiPipeCall(model, prompt);
          chatHistory.push({ role: "tool", tool_call_id: toolCall.id, content: results });
        }
        else if (toolCall.function.name === "runJS") {
          const { code } = JSON.parse(toolCall.function.arguments);
          appendMessage("Agent", `Running JS code: ${code}`, "agent-msg");
          const result = await handleRunJS(code);
          chatHistory.push({ role: "tool", tool_call_id: toolCall.id, content: result });
        }
      }
      continue;
    }

    if (assistantMessage.content) {
      appendMessage("Agent", assistantMessage.content, "agent-msg");
      return;
    }
  }
  appendAlert("⚠️ Stopped after max steps (loop safeguard).", "warning");
}

async function handleGoogleSearch(query) {
  let gApiKey = localStorage.getItem("GOOGLE_API_KEY");
  let gCx = localStorage.getItem("GOOGLE_CX");
  if (!gApiKey || !gCx) {
    const key = prompt("Enter your Google API Key:");
    const cx = prompt("Enter your Google Search Engine CX:");
    if (!key || !cx) {
      appendAlert("❌ Missing Google API credentials", "danger");
      return "Search failed (missing credentials)";
    }
    localStorage.setItem("GOOGLE_API_KEY", key);
    localStorage.setItem("GOOGLE_CX", cx);
    gApiKey = key;
    gCx = cx;
  }

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${gApiKey}&cx=${gCx}&q=${encodeURIComponent(query)}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);

    if (data.items && data.items.length > 0) {
      const snippets = data.items.slice(0, 3).map(it => `- ${it.title}: ${it.snippet}`).join("\n");
      appendMessage("Search Results", snippets, "tool-msg");
      return snippets;
    } else {
      appendMessage("Search Results", "No results found.", "tool-msg");
      return "No results found.";
    }
  } catch (err) {
    appendAlert("Google Search failed: " + err.message, "danger");
    return "Search failed: " + err.message;
  }
}

async function handleAiPipeCall(model, prompt) {
  let aipipeKey = localStorage.getItem("AIPIPE_API_KEY");
  if (!aipipeKey) {
    aipipeKey = prompt("Enter your AI Pipe API Key:");
    localStorage.setItem("AIPIPE_API_KEY", aipipeKey);
  }

  try {
    const resp = await fetch("https://aipipe.org/openrouter/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${aipipeKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  } catch (err) {
    appendAlert("AI Pipe call failed: " + err.message, "danger");
    return "AI Pipe call failed: " + err.message;
  }
}

async function handleRunJS(code) {
  try {
    const result = sandbox.contentWindow.eval(code);
    appendMessage("JS Result", String(result), "tool-msg");
    return String(result);
  } catch (err) {
    appendAlert("JS execution failed: " + err.message, "danger");
    return "JS execution failed: " + err.message;
  }
}

function appendMessage(sender, text, cssClass) {
  const chatBox = document.getElementById("chat-box");
  const msgDiv = document.createElement("div");
  msgDiv.className = cssClass;
  msgDiv.textContent = `${sender}: ${text}`;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendAlert(text, type) {
  const chatBox = document.getElementById("chat-box");
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = text;
  chatBox.appendChild(alertDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// init on page load
initProvider();
