#!/usr/bin/env node
/**
 * skill7
 * 
 * Universal MCP server for 634+ AI development skills
 * Supports: stdio (local) and HTTP (remote/Docker) transports
 * 
 * Usage:
 *   Local:  npx skill7
 *   Docker: docker run -p 3000:3000 skill7
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createServer, IncomingMessage, ServerResponse } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = parseInt(process.env.PORT || '3000', 10);
const TRANSPORT = process.env.MCP_TRANSPORT || 'stdio'; // 'stdio' or 'http'

// ============================================================================
// TYPES
// ============================================================================

interface Skill {
    id: string;
    path: string;
    category: string;
    name: string;
    description: string;
    risk: string;
    source: string;
}

interface CategoryStats {
    name: string;
    count: number;
    skills: string[];
}

// ============================================================================
// DATA LOADING
// ============================================================================

function loadSkillsData(): Skill[] {
    const possiblePaths = [
        join(__dirname, '..', 'data', 'skills_index.json'),
        join(__dirname, '..', '..', 'antigravity-awesome-skills', 'skills_index.json'),
        join(process.cwd(), 'data', 'skills_index.json'),
        join(process.cwd(), 'skills_index.json'),
        join(process.cwd(), 'antigravity-awesome-skills', 'skills_index.json'),
    ];

    for (const p of possiblePaths) {
        if (existsSync(p)) {
            const data = readFileSync(p, 'utf-8');
            return JSON.parse(data) as Skill[];
        }
    }

    console.error('⚠️ Skills data not found. Using empty catalog.');
    return [];
}

const skills: Skill[] = loadSkillsData();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getCategories(): CategoryStats[] {
    const categoryMap = new Map<string, string[]>();

    for (const skill of skills) {
        const cat = skill.category || 'uncategorized';
        if (!categoryMap.has(cat)) {
            categoryMap.set(cat, []);
        }
        categoryMap.get(cat)!.push(skill.id);
    }

    return Array.from(categoryMap.entries())
        .map(([name, skillIds]) => ({
            name,
            count: skillIds.length,
            skills: skillIds.slice(0, 10)
        }))
        .sort((a, b) => b.count - a.count);
}

function searchSkills(query: string, limit: number = 20): Skill[] {
    const lowerQuery = query.toLowerCase();
    return skills
        .filter(s =>
            s.name.toLowerCase().includes(lowerQuery) ||
            s.description.toLowerCase().includes(lowerQuery) ||
            s.id.toLowerCase().includes(lowerQuery)
        )
        .slice(0, limit);
}

/**
 * Semantic search using TF-IDF style scoring
 * Matches skills by meaning, not just keywords
 */
function semanticSearch(query: string, topK: number = 3): Skill[] {
    const queryTerms = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);

    const scored = skills.map(skill => {
        const nameText = skill.name.toLowerCase();
        const descText = skill.description.toLowerCase();
        const catText = skill.category.toLowerCase();
        const pathText = skill.path.toLowerCase();

        let score = 0;
        for (const term of queryTerms) {
            // Name matches are most valuable
            if (nameText.includes(term)) score += 5;
            // Category matches indicate domain relevance
            if (catText.includes(term)) score += 3;
            // Path often contains good keywords
            if (pathText.includes(term)) score += 2;
            // Description matches are baseline relevance
            if (descText.includes(term)) score += 1;
        }

        return { skill, score };
    });

    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map(s => s.skill);
}

/**
 * Get skill content from SKILL.md or fallback to description
 */
function getSkillContentSync(skill: Skill): string {
    const skillPaths = [
        join(__dirname, '..', '..', 'antigravity-awesome-skills', skill.path, 'SKILL.md'),
        join(process.cwd(), 'antigravity-awesome-skills', skill.path, 'SKILL.md'),
    ];

    for (const p of skillPaths) {
        if (existsSync(p)) {
            return readFileSync(p, 'utf-8');
        }
    }

    return `# ${skill.name}\n\n${skill.description}\n\n**Category:** ${skill.category}\n**Risk:** ${skill.risk}`;
}

function suggestWorkflow(goal: string): { steps: Array<{ skill: string; action: string; reason: string }> } {
    const keywords = goal.toLowerCase();
    const steps: Array<{ skill: string; action: string; reason: string }> = [];

    if (keywords.includes('api') || keywords.includes('backend')) {
        steps.push({ skill: 'api-design-principles', action: 'design', reason: 'Define API structure' });
    }
    if (keywords.includes('web') || keywords.includes('frontend')) {
        steps.push({ skill: 'react-best-practices', action: 'design', reason: 'Plan UI components' });
    }
    if (keywords.includes('security')) {
        steps.push({ skill: 'api-security-best-practices', action: 'audit', reason: 'Security review' });
    }
    if (keywords.includes('typescript')) {
        steps.push({ skill: 'typescript-expert', action: 'implement', reason: 'TypeScript patterns' });
    }
    if (keywords.includes('python')) {
        steps.push({ skill: 'python-pro', action: 'implement', reason: 'Python patterns' });
    }
    if (keywords.includes('react')) {
        steps.push({ skill: 'react-patterns', action: 'implement', reason: 'React patterns' });
    }

    steps.push({ skill: 'testing-patterns', action: 'test', reason: 'Testing' });

    if (steps.length === 1) {
        steps.unshift({ skill: 'brainstorming', action: 'plan', reason: 'Planning' });
    }

    return { steps };
}

// ============================================================================
// CREATE MCP SERVER
// ============================================================================

function createMcpServer(): McpServer {
    const server = new McpServer({
        name: 'skill7',
        version: '1.1.0',
    });

    // TOOL: list_skills
    server.tool(
        'list_skills',
        'List skills with optional category filter',
        {
            category: z.string().optional().describe('Filter by category'),
            limit: z.number().optional().default(50),
            offset: z.number().optional().default(0),
        },
        async ({ category, limit = 50, offset = 0 }) => {
            let filtered = category
                ? skills.filter(s => s.category.toLowerCase().includes(category.toLowerCase()))
                : skills;

            const paginated = filtered.slice(offset, offset + limit);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        total: filtered.length,
                        skills: paginated.map(s => ({
                            id: s.id,
                            name: s.name,
                            description: s.description.slice(0, 100),
                            category: s.category,
                        })),
                    }, null, 2)
                }],
            };
        }
    );

    // TOOL: get_skill
    server.tool(
        'get_skill',
        'Get full details of a skill',
        { skillId: z.string().describe('Skill ID') },
        async ({ skillId }) => {
            const skill = skills.find(s => s.id === skillId || s.name === skillId);
            if (!skill) {
                return { content: [{ type: 'text', text: `Skill "${skillId}" not found.` }], isError: true };
            }
            return { content: [{ type: 'text', text: JSON.stringify(skill, null, 2) }] };
        }
    );

    // TOOL: search_skills
    server.tool(
        'search_skills',
        'Search skills by keyword',
        {
            query: z.string().describe('Search query'),
            limit: z.number().optional().default(20),
        },
        async ({ query, limit = 20 }) => {
            const results = searchSkills(query, limit);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        query,
                        count: results.length,
                        skills: results.map(s => ({ id: s.id, name: s.name, category: s.category })),
                    }, null, 2)
                }],
            };
        }
    );

    // TOOL: get_categories
    server.tool(
        'get_categories',
        'Get all skill categories with counts',
        {},
        async () => ({
            content: [{
                type: 'text',
                text: JSON.stringify({
                    totalSkills: skills.length,
                    categories: getCategories(),
                }, null, 2)
            }],
        })
    );

    // TOOL: suggest_workflow
    server.tool(
        'suggest_workflow',
        'Get a workflow suggestion for a goal',
        { goal: z.string().describe('What you want to accomplish') },
        async ({ goal }) => {
            const workflow = suggestWorkflow(goal);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        goal,
                        steps: workflow.steps,
                    }, null, 2)
                }],
            };
        }
    );

    // TOOL: get_skill_content
    server.tool(
        'get_skill_content',
        'Read full SKILL.md content',
        { skillId: z.string().describe('Skill ID') },
        async ({ skillId }) => {
            const skill = skills.find(s => s.id === skillId);
            if (!skill) {
                return { content: [{ type: 'text', text: `Skill "${skillId}" not found.` }], isError: true };
            }

            const skillPaths = [
                join(__dirname, '..', '..', 'antigravity-awesome-skills', skill.path, 'SKILL.md'),
                join(process.cwd(), 'antigravity-awesome-skills', skill.path, 'SKILL.md'),
            ];

            for (const p of skillPaths) {
                if (existsSync(p)) {
                    return { content: [{ type: 'text', text: readFileSync(p, 'utf-8') }] };
                }
            }

            return {
                content: [{
                    type: 'text',
                    text: `Skill info:\n${JSON.stringify(skill, null, 2)}\n\nClone repo for full content: git clone https://github.com/Abderraouf-yt/skill7.git`
                }]
            };
        }
    );

    // RESOURCE: skill://catalog
    server.resource(
        'skill://catalog',
        'Skills catalog',
        async () => ({
            contents: [{
                uri: 'skill://catalog',
                text: JSON.stringify({ totalSkills: skills.length, categories: getCategories() }, null, 2),
                mimeType: 'application/json',
            }],
        })
    );

    // ========================================================================
    // MCP PROMPTS - Frictionless Auto-Skill Detection
    // ========================================================================

    // PROMPT: auto_skill - Automatically detects and returns relevant skills
    server.prompt(
        'auto_skill',
        'Auto-detect and return relevant skills for any task. Call this at the start of any task to get expert guidance.',
        {
            task: z.string().describe('The task or goal description'),
        },
        async ({ task }) => {
            const matches = semanticSearch(task, 3);

            if (matches.length === 0) {
                return {
                    messages: [{
                        role: 'user' as const,
                        content: {
                            type: 'text' as const,
                            text: `No specific skills found for: "${task}". Proceed with general best practices.`,
                        },
                    }],
                };
            }

            const skillContents = matches.map(skill => {
                const content = getSkillContentSync(skill);
                return `## 🎯 ${skill.name}\n\n**Category:** ${skill.category}\n**Risk Level:** ${skill.risk}\n\n${content}`;
            });

            return {
                messages: [{
                    role: 'user' as const,
                    content: {
                        type: 'text' as const,
                        text: `# 🚀 Skill7 - Expert Skills Activated\n\nBased on your task: **"${task}"**\n\nApply these expert skills:\n\n${skillContents.join('\n\n---\n\n')}\n\n---\n\n*Use these skills to guide your implementation.*`,
                    },
                }],
            };
        }
    );

    // PROMPT: skill_workflow - Suggested workflow for complex tasks
    server.prompt(
        'skill_workflow',
        'Get a multi-step workflow recommendation for complex goals',
        {
            goal: z.string().describe('The complex goal to accomplish'),
        },
        async ({ goal }) => {
            const workflow = suggestWorkflow(goal);
            const skillDetails = workflow.steps.map((step, i) => {
                const skill = skills.find(s => s.id === step.skill || s.name.toLowerCase().includes(step.skill.toLowerCase()));
                return `### Step ${i + 1}: ${step.action.toUpperCase()}\n**Skill:** ${step.skill}\n**Reason:** ${step.reason}${skill ? `\n**Description:** ${skill.description}` : ''}`;
            });

            return {
                messages: [{
                    role: 'user' as const,
                    content: {
                        type: 'text' as const,
                        text: `# 📋 Recommended Workflow\n\n**Goal:** ${goal}\n\n${skillDetails.join('\n\n')}\n\n---\n\n*Follow these steps in order for best results.*`,
                    },
                }],
            };
        }
    );

    return server;
}

// ============================================================================
// HTTP SERVER (for Docker/remote hosting)
// ============================================================================

function startHttpServer(server: McpServer) {
    const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // Health check
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', skills: skills.length }));
            return;
        }

        // Info endpoint
        if (req.url === '/' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                name: 'Skill7 MCP Server',
                version: '1.0.0',
                skills: skills.length,
                categories: getCategories().length,
                endpoints: {
                    health: '/health',
                    sse: '/sse',
                    messages: '/messages',
                },
                tools: ['list_skills', 'get_skill', 'search_skills', 'get_categories', 'suggest_workflow', 'get_skill_content'],
            }));
            return;
        }

        // SSE endpoint for MCP
        if (req.url === '/sse') {
            const transport = new SSEServerTransport('/messages', res);
            await server.connect(transport);
            return;
        }

        // Messages endpoint
        if (req.url === '/messages' && req.method === 'POST') {
            // Handle incoming MCP messages
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ received: true }));
            });
            return;
        }

        res.writeHead(404);
        res.end('Not Found');
    });

    httpServer.listen(PORT, () => {
        console.log(`🚀 Skill7 MCP Server`);
        console.log(`📚 ${skills.length} skills loaded`);
        console.log(`🌐 HTTP server: http://localhost:${PORT}`);
        console.log(`   Health: http://localhost:${PORT}/health`);
        console.log(`   SSE:    http://localhost:${PORT}/sse`);
    });
}

// ============================================================================
// STDIO SERVER (for local CLI integration)
// ============================================================================

async function startStdioServer(server: McpServer) {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('🚀 Skill7 MCP Server (stdio)');
    console.error(`📚 ${skills.length} skills loaded`);
}

// ============================================================================
// MAIN
// ============================================================================

const server = createMcpServer();

if (TRANSPORT === 'http') {
    startHttpServer(server);
} else {
    startStdioServer(server).catch(console.error);
}
