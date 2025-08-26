# LLM Agent POC

A minimal browser-based **LLM Agent** that demonstrates reasoning loops, tool usage, and interactive conversations with AI models.  
Built with **HTML + JavaScript + Bootstrap**, this POC is designed to be simple, hackable, and GitHub-hostable.

---

## ✨ Features
- **Model Picker** – Switch between Echo (mock) and AI Pipe models.  
- **Tool Calling** – Supports OpenAI-style tool/function calls:  
  - 🔍 Google Search API (fetch top snippets)  
  - 🔗 AI Pipe Proxy (delegate prompts to another AI model)  
  - 🖥️ JavaScript Execution (sandboxed inside an iframe)  
- **Reasoning Loop** – Agent keeps calling tools until it can produce a final answer.  
- **Bootstrap Alerts** – Friendly error and system messages.  
- **Simple UI** – Chat window, model selector, send box.  

---

## 📂 Project Structure
```
llm-agent-poc/
├── index.html       # Main UI
├── css/
│   └── style.css    # Custom styles
└── js/
    └── app.js       # Core agent logic
```

---

## 🚀 Getting Started

### 1. Clone & Run
```bash
git clone https://github.com/your-username/llm-agent-poc.git
cd llm-agent-poc
```

Open `index.html` in your browser (no server needed).  

### 2. Configure API Keys
The app will **prompt you for API keys on first use** and store them in `localStorage`.

- **AI Pipe API Key**  
  Get one from [https://aipipe.org](https://aipipe.org).  
  Stored as `AIPIPE_API_KEY`.  

- **Google Search API Key & CX**  
  1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).  
  2. Enable **Custom Search JSON API**.  
  3. Generate an **API Key**.  
  4. Create a **Custom Search Engine** at [https://cse.google.com/cse/](https://cse.google.com/cse/).  
  5. Copy your **CX (Search Engine ID)**.  
  Stored as `GOOGLE_API_KEY` and `GOOGLE_CX`.  

---

## 🧑‍💻 Usage

1. Choose a model from the dropdown (`Echo` or `AI Pipe`).  
2. Type a message into the input box.  
3. Watch the agent reason, call tools, and respond in real-time.  

---

## 📖 Examples

### Example 1 – Tool Use (Google Search)
```
You: Tell me about IBM
Agent: Requested search for: IBM
Search Results:
 - IBM: For more than a century, IBM has been a global technology innovator...
 - IBM Research: At IBM Research, we're inventing what's next...
 - Define your career with IBM: Explore jobs at IBM...
Agent: IBM, or International Business Machines Corporation, is a global tech company...
```

### Example 2 – Code Execution
```
You: What is 23 * 42? Use JavaScript.
Agent: Running JS code: 23 * 42
JS Result: 966
Agent: The result of 23 multiplied by 42 is 966.
```

### Example 3 – Proxy to Another Model
```
You: Summarize IBM in one sentence using another model.
Agent: Delegating to AI Pipe model: openai/gpt-4.1
Agent: IBM is a multinational technology and consulting company specializing in AI and cloud computing.
```

---

## ⚠️ Notes
- **JS execution is sandboxed** in an iframe, but still keep input trusted.  
- This is a **POC** – not production-ready. Security and error handling are minimal.  

---

## 📜 License
MIT License. Feel free to fork, hack, and extend!
