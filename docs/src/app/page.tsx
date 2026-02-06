"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import skillsData from "@/data/skills.json";
import { semanticSearch } from "@/lib/semanticSearch";
import GradientText from "@/components/visuals/GradientText";
import Antigravity from "@/components/visuals/Antigravity";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Skill, SkillsData } from "@/types/skills";
import Image from "next/image";

const rawSkills = skillsData as SkillsData;

// Category inference rules based on skill name/description keywords - 2026 Modern Standard
const categoryRules: { category: string; keywords: string[] }[] = [
  { category: "agentic-systems", keywords: ["agent", "autonomous", "task", "planning", "memory", "tool use", "function calling", "react", "reAct", "reflection", "multi-agent", "swarm", "orchestration", "autogen", "langchain", "crewai"] },
  { category: "generative-ai", keywords: ["llm", "gpt", "openai", "anthropic", "claude", "gemini", "llama", "mistral", "inference", "context", "token", "embedding", "transformer", "huggingface", "weights", "diffusion", "image gen"] },
  { category: "knowledge-engineering", keywords: ["rag", "retrieval", "vector", "embedding", "chroma", "pinecone", "milvus", "qdrant", "weaviate", "search", "semantic", "knowledge base", "document", "pdf", "unstructured"] },
  { category: "security-engineering", keywords: ["security", "penetration", "red team", "exploit", "vulnerability", "attack", "pentest", "auth", "authentication", "encryption", "csrf", "xss", "shield", "guardrail", "owasp", "devsecops"] },
  { category: "product-experience", keywords: ["frontend", "ui", "ux", "react", "vue", "angular", "svelte", "next", "tailwind", "css", "component", "design system", "animation", "framer", "responsive", "mobile", "app", "accessibility", "wcag"] },
  { category: "interactive-media", keywords: ["game", "3d", "canvas", "three.js", "webgl", "ogl", "shader", "unity", "unreal", "godot", "rendering", "audio", "video"] },
  { category: "platform-engineering", keywords: ["backend", "api", "server", "express", "fastapi", "django", "node", "database", "sql", "postgres", "redis", "docker", "kubernetes", "cloud", "aws", "deploy", "serverless", "infrastructure", "microservices"] },
  { category: "automation-ops", keywords: ["workflow", "automation", "script", "bot", "scraper", "crawler", "browser", "playwright", "puppeteer", "selenium", "cron", "pipeline", "etl", "rpa"] },
  { category: "web3-core", keywords: ["blockchain", "web3", "solidity", "ethereum", "smart contract", "crypto", "nft", "token", "defi", "wallet", "dapp"] },
  { category: "data-intelligence", keywords: ["data", "analytics", "visualization", "pandas", "numpy", "matplotlib", "jupyter", "python", "statistics", "analysis", "mining", "scrape", "etl"] },
  { category: "dev-excellence", keywords: ["git", "testing", "debug", "monitor", "log", "lint", "format", "cli", "terminal", "bash", "shell", "ide", "vscode", "productivity"] },
];

// Infer category from skill name and description
function inferCategory(skill: Skill): string {
  const text = `${skill.name} ${skill.description} ${skill.path} ${skill.category || ''}`.toLowerCase();

  for (const rule of categoryRules) {
    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) {
        return rule.category;
      }
    }
  }

  // Fallback Mapping for Legacy Paths
  if (skill.path.includes("game-development")) return "interactive-media";
  if (skill.path.includes("security")) return "security-engineering";
  if (skill.path.includes("agent")) return "agentic-systems";

  return "dev-excellence";
}

// Category Normalization & Display Labels
const categoryNormalization: Record<string, string> = {
  // Legacy -> Modern Mapping
  "game-development": "interactive-media",
  "game-dev": "interactive-media",
  "game-developements": "interactive-media",
  "frontend-ui": "product-experience",
  "backend-infra": "platform-engineering",
  "agentic-ai": "agentic-systems",
  "llm-core": "generative-ai",
  "rag-knowledge": "knowledge-engineering",
  "security": "security-engineering",
  "automation": "automation-ops",
  "blockchain": "web3-core",
  "data-science": "data-intelligence",
  "dev-tools": "dev-excellence",
  "uncategorized": "dev-excellence"
};

const categoryLabels: Record<string, string> = {
  "agentic-systems": "Agentic Systems",
  "generative-ai": "Generative AI",
  "knowledge-engineering": "Knowledge & RAG",
  "platform-engineering": "Platform Eng",
  "product-experience": "Product Experience",
  "interactive-media": "Game & 3D Media",
  "security-engineering": "Security",
  "automation-ops": "Automation Ops",
  "web3-core": "Web3 Core",
  "data-intelligence": "Data Intelligence",
  "dev-excellence": "Dev Excellence",
};

function normalizeCategory(cat: string): string {
  if (!cat) return "dev-excellence";
  const lower = cat.toLowerCase().trim();
  // Check direct updated keys first, then normalization map
  const normalized = categoryNormalization[lower] || lower;

  // Ensure we only return valid modern keys if possible, usually the map handles it.
  // If the normalized key isn't in our icons map (checked later), it defaults.
  return normalized;
}

// Process skills with inferred categories
const skills = rawSkills.map(skill => {
  let cat = skill.category;

  // Re-infer if uncategorized OR if we want to force modern categorization on old data
  // Strategies: 1. Trust 'category' if valid modern key. 2. Normalize if legacy. 3. Infer if 'uncategorized'.

  const normalizedInput = categoryNormalization[cat?.toLowerCase() || ""] || cat;
  const isModern = categoryLabels[normalizedInput];

  if (!isModern || cat === "uncategorized" || !cat) {
    cat = inferCategory(skill);
  } else {
    cat = normalizedInput;
  }

  return {
    ...skill,
    inferredCategory: cat
  };
});

const riskColors: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  safe: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  unknown: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const categoryIcons: Record<string, string> = {
  "agentic-systems": "🤖",
  "generative-ai": "🧠",
  "knowledge-engineering": "📚",
  "security-engineering": "🛡️",
  "product-experience": "🎨",
  "interactive-media": "🎮",
  "platform-engineering": "☁️",
  "automation-ops": "⚡",
  "web3-core": "🔗",
  "data-intelligence": "📊",
  "dev-excellence": "🛠️",
  "uncategorized": "📦",
};

import Orb from "@/components/visuals/Orb";

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<typeof skills[0] | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(24);

  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute categories from inferred categories
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    skills.forEach((skill) => {
      const cat = skill.inferredCategory;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, []);

  const BASE_PATH = "/skills-mcp-server";

  const filteredSkills = useMemo(() => {
    let result = skills;

    // Apply strict semantic search if query exists
    if (search.trim()) {
      const scored = semanticSearch(search, skills, 1000); // Get all matches, ranked
      result = scored.map(s => s.skill);
    }

    // Apply category filter
    if (selectedCategory) {
      result = result.filter(skill => skill.inferredCategory === selectedCategory);
    }

    return result;
  }, [search, selectedCategory]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(24);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [search, selectedCategory]);

  const visibleSkills = filteredSkills.slice(0, visibleCount);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (selectedSkill) {
      if (e.key === "Escape") {
        setSelectedSkill(null);
      }
      return;
    }

    // Don't navigate while typing in search
    if (document.activeElement === searchRef.current) {
      if (e.key === "Escape") {
        searchRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case "/":
        e.preventDefault();
        searchRef.current?.focus();
        break;
    }
  }, [selectedSkill]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20 relative overflow-hidden">
      {/* Background Grids & Orbs */}
      <div className="fixed inset-0 bg-grid-white/[0.02] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-gradient-to-tr from-background via-background to-primary/5 pointer-events-none z-0" />

      {/* Animated Orb Background */}
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] opacity-20 pointer-events-none z-0">
        <Orb hoverIntensity={0.5} rotateOnHover={true} hue={0} forceHoverState={true} />
      </div>
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] opacity-10 pointer-events-none z-0">
        <Orb hoverIntensity={0.3} rotateOnHover={true} hue={180} forceHoverState={true} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/40 supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 group cursor-default">
              <Antigravity range={6} duration={4}>
                <div className="relative w-10 h-10 transition-transform group-hover:scale-110 duration-500">
                  <Image src={`${BASE_PATH}/logo.svg`} alt="Logo" width={40} height={40} className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                </div>
              </Antigravity>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold tracking-tight text-foreground">
                  <GradientText
                    colors={["#e2e8f0", "#a78bfa", "#3b82f6", "#e2e8f0"]}
                    animationSpeed={6}
                    className="text-lg font-bold tracking-tight"
                  >
                    Antigravity Skills
                  </GradientText>
                </h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{skills.length} EXPERT MODULES</p>
              </div>
            </div>
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-full" />
                <Input
                  ref={searchRef}
                  placeholder="Search skills... (press /)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-secondary/50 border-white/5 focus:border-primary/50 h-9 transition-all relative z-10"
                />
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-[10px] text-muted-foreground font-medium bg-secondary/30 px-3 py-1.5 rounded-full border border-white/5">
              <span className="flex items-center gap-1"><kbd className="font-sans bg-transparent">↑↓</kbd> nav</span>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1"><kbd className="font-sans bg-transparent">↵</kbd> open</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-9"
                onClick={() => window.open("/playground", "_blank")}
              >
                🎮 Playground
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-primary/20 text-primary hover:bg-primary/10 h-9 gap-2"
                onClick={() => window.open("https://github.com/Abderraouf-yt/skills-mcp-server", "_blank")}
              >
                <span>⭐</span> Star on GitHub
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex-1 relative z-10">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 shrink-0 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Skill Categories</h2>
                <div className="space-y-0.5">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all font-medium ${!selectedCategory
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                  >
                    All Skills <span className="float-right opacity-50 font-normal">{skills.length}</span>
                  </button>
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-300px)] pr-3 -mr-3">
                <div className="space-y-0.5">
                  {categories.map(([cat, count]) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center justify-between group ${selectedCategory === cat
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="opacity-70 group-hover:opacity-100 transition-opacity">{categoryIcons[cat] || "📁"}</span>
                        {categoryLabels[cat] || cat}
                      </span>
                      <span className="text-[10px] bg-secondary/50 px-1.5 py-0.5 rounded opacity-60 group-hover:opacity-100 transition-opacity">{count}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </aside>

          {/* Main Grid */}
          <main className="flex-1 min-w-0" ref={containerRef}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">
                {selectedCategory ? (
                  <span className="flex items-center gap-2">
                    {categoryIcons[selectedCategory]} {categoryLabels[selectedCategory] || selectedCategory}
                    <Badge variant="secondary" className="ml-2 text-xs bg-primary/10 text-primary border-transparent h-5">{filteredSkills.length}</Badge>
                  </span>
                ) : (
                  <span>Explore Skills</span>
                )}
              </h2>
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="text-muted-foreground hover:text-foreground h-8 text-xs"
                >
                  Clear filter
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
              {visibleSkills.map((skill, index) => {
                const isFocused = index === focusedIndex;
                return (
                  <div
                    key={skill.id}
                    onClick={() => setSelectedSkill(skill)}
                    className={`group relative p-5 h-[200px] flex flex-col justify-between rounded-3xl border bg-card/40 backdrop-blur-xl transition-all duration-500 hover:bg-card/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer overflow-hidden ${isFocused
                      ? "ring-2 ring-primary/70 border-primary/50 shadow-[0_0_30px_rgba(139,92,246,0.2)]"
                      : "border-white/5 hover:border-primary/20"
                      }`}
                  >
                    {/* Animated Gradient Mesh */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-primary/[0.02] opacity-100 transition-opacity duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-700 filter blur-xl" />

                    {/* Top Section */}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-lg shadow-inner ring-1 ring-white/10 group-hover:ring-primary/30 transition-all">
                            {categoryIcons[skill.inferredCategory] || "📦"}
                          </div>
                          <Badge variant="outline" className={`text-[9px] h-5 px-2 font-mono uppercase tracking-wider border-0 bg-opacity-20 backdrop-blur-md ${riskColors[skill.risk] || riskColors.unknown}`}>
                            {skill.risk}
                          </Badge>
                        </div>
                        {skill.source !== "unknown" && (
                          <span className="text-[9px] text-muted-foreground/30 font-mono uppercase tracking-widest group-hover:text-primary/40 transition-colors">
                            {skill.source}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-100 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-primary/80 transition-all text-base line-clamp-1 tracking-tight mb-2">
                        {skill.name}
                      </h3>
                      <p className="text-muted-foreground/70 text-xs line-clamp-3 leading-relaxed font-medium">
                        {skill.description}
                      </p>
                    </div>

                    {/* Bottom Section */}
                    <div className="pt-3 border-t border-white/5 relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 font-mono overflow-hidden">
                        <span className="shrink-0 text-primary/40">./</span>
                        <span className="truncate group-hover:text-primary/70 transition-colors">{skill.path.split('/').pop()}</span>
                      </div>
                      <div className="w-6 h-6 rounded-full border border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <span className="text-[10px] text-primary">↗</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {visibleCount < filteredSkills.length && (
              <div className="flex justify-center py-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setVisibleCount(prev => prev + 24)}
                  className="rounded-full px-8 border-white/10 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-lg shadow-black/20 font-medium"
                >
                  Load More Skills ({filteredSkills.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-background/50 py-8 mt-auto z-10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
            <Image src={`${BASE_PATH}/logo.svg`} alt="AntiGravity" width={24} height={24} className="grayscale" />
          </div>
          <p className="text-muted-foreground text-sm">
            Made with <span className="text-rose-500 animate-pulse">❤️</span> by{" "}
            <a
              href="https://github.com/Abderraouf-yt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors font-medium"
            >
              abderraouf-yt
            </a>
          </p>
          <p className="text-muted-foreground/50 text-xs mt-2 font-mono">
            Universal Skills for AI Agents • {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* Skill Detail Dialog */}
      <Dialog open={!!selectedSkill} onOpenChange={() => setSelectedSkill(null)}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 max-w-2xl sm:max-w-3xl p-0 gap-0 overflow-hidden shadow-2xl">
          {selectedSkill && (
            <div className="flex flex-col h-[600px]">
              <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-gradient-to-r from-secondary/20 to-transparent">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-2xl border border-white/5">
                    {categoryIcons[selectedSkill.inferredCategory] || "📁"}
                  </div>
                  <div>
                    <DialogTitle className="text-xl text-foreground font-bold">
                      {selectedSkill.name}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-[10px] px-2 h-5 border-0 ${riskColors[selectedSkill.risk] || riskColors.unknown}`}>
                        {selectedSkill.risk} Risk
                      </Badge>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground font-mono">{selectedSkill.source}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-invert max-w-none">
                  <h4 className="text-sm font-semibold text-foreground/80 mb-2">Description</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    {selectedSkill.description}
                  </p>

                  <h4 className="text-sm font-semibold text-foreground/80 mb-2">File Path</h4>
                  <div className="bg-secondary/30 rounded-lg p-3 border border-white/5 font-mono text-xs text-primary/80 break-all select-all">
                    {selectedSkill.path}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-secondary/10 flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={() => setSelectedSkill(null)}>
                  Close
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                  onClick={() =>
                    window.open(
                      `https://github.com/Abderraouf-yt/antigravity-awesome-skills/tree/main/${selectedSkill.path}`,
                      "_blank"
                    )
                  }
                >
                  View Source on GitHub ↗
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
