# 🌌 Antigravity Skills MCP Server

**634+ AI development skills for any MCP-compatible AI client**

## ⚡ Quick Start

### Option 1: Local (stdio)
```bash
git clone https://github.com/Abderraouf-yt/skills-mcp-server.git
cd skills-mcp-server
npm install && npm run build
npm run setup:gemini  # or setup:claude, setup:cursor
```

### Option 2: Docker (HTTP)
```bash
docker run -p 3000:3000 abderraoufyt/skills-mcp-server
```

### Option 3: Docker Compose
```bash
git clone https://github.com/Abderraouf-yt/skills-mcp-server.git
cd skills-mcp-server
docker-compose up -d
```

---

## 🛠️ Tools

| Tool | What it does |
|------|--------------|
| `list_skills` | Browse skills by category |
| `search_skills` | Find skills by keyword |
| `get_skill` | Get full skill details |
| `get_categories` | View all categories |
| `suggest_workflow` | Get step-by-step guidance |
| `get_skill_content` | Read SKILL.md content |

---

## 📦 Manual Setup

Add to your MCP config:

```json
{
  "mcpServers": {
    "antigravity-skills": {
      "command": "node",
      "args": ["/path/to/skills-mcp-server/dist/index.js"]
    }
  }
}
```

**Config locations:**
- Gemini CLI: `~/.gemini/settings.json`
- Claude: `~/.config/claude/mcp_config.json`
- Cursor: `~/.cursor/mcp.json`

---

## 🐳 Docker Hosting

**Environment variables:**
- `MCP_TRANSPORT=http` (default in Docker)
- `PORT=3000`

**Endpoints:**
- `GET /` - Server info
- `GET /health` - Health check
- `GET /sse` - MCP SSE connection

---

## 📂 Skill Categories

| Category | Count |
|----------|-------|
| Security | 107 |
| General | 95 |
| Data & AI | 81 |
| Development | 72 |
| Infrastructure | 72 |
| Architecture | 52 |
| Business | 35 |
| Testing | 21 |

---

## License

MIT © Antigravity
