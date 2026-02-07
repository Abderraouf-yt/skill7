'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import skillsData from '@/data/skills.json';
import { semanticSearch, generateWorkflow, ScoredSkill } from '@/lib/semanticSearch';
import { ArrowRight, Sparkles, Zap, Shield, CheckCircle2, PlayCircle, Database, Code } from 'lucide-react';
import Link from 'next/link';

// Component for consistent Deploy buttons
function DeployButton({ label, icon: Icon, className }: { label: string, icon: any, className?: string }) {
    return (
        <Button
            className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all transform hover:-translate-y-0.5 ${className}`}
            onClick={() => window.open('https://github.com/Abderraouf-yt/skill7', '_blank')}
        >
            <Icon className="w-4 h-4 mr-2" />
            {label}
        </Button>
    )
}

export default function PlaygroundPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ScoredSkill[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    // Live search effect
    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const timer = setTimeout(() => {
            // @ts-ignore - skillsData type mismatch workaround for quick prototyping
            const skills = (skillsData.skills || skillsData) as any[];
            const matched = semanticSearch(query, skills, 3);
            setResults(matched);
            setIsTyping(false);
        }, 300); // Debounce

        setIsTyping(true);
        return () => clearTimeout(timer);
    }, [query]);

    const workflow = generateWorkflow(query, results.map(r => r.skill));

    // Simulate the exact JSON response from the MCP server
    const simulatedResponse = {
        role: 'user',
        content: {
            type: 'text',
            text: `# 🚀 Skill7 - Expert Skills Activated\n\nBased on your task: "${query}"\n\nApply these expert skills:\n\n${results.map(r => `## 🎯 ${r.skill.name}\n\n**Category:** ${r.skill.category}\n**Risk Level:** ${r.skill.risk || 'unknown'}\n\n${r.skill.description}\n\n*(Full technical instructions injected here...)*`).join('\n\n---\n\n')}`
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans selection:bg-purple-500/30">

            {/* Header */}
            <header className="mb-12 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div>
                    <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors mb-2 block">← Back to Showcase</Link>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Workflow Playground
                    </h1>
                    <p className="text-zinc-400 mt-2">
                        Experience the MCP server's "Context Injection" brain in your browser.
                    </p>
                </div>
                {/* GLOBAL DEPLOY CTA */}
                <div className="hidden md:block">
                    <DeployButton label="Deploy @mcp:context7" icon={Zap} />
                </div>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 h-[calc(100vh-200px)]">

                {/* LEFT: Input & Context Simulation */}
                <div className="flex flex-col gap-6 h-full">
                    <Card className="flex-1 bg-zinc-900/50 border-white/10 backdrop-blur-xl flex flex-col overflow-hidden relative group">
                        {/* INPUT PANEL CTA */}
                        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-xs" onClick={() => window.open('https://github.com/Abderraouf-yt/skill7', '_blank')}>
                                <Code className="w-3 h-3 mr-1" /> Use in IDE
                            </Button>
                        </div>

                        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
                            <div className="px-6 pt-6 pb-2 border-b border-white/5 flex items-center justify-between">
                                <TabsList className="bg-black/40 border border-white/10">
                                    <TabsTrigger value="chat" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                                        <Sparkles className="w-4 h-4 mr-2" /> Simulation
                                    </TabsTrigger>
                                    <TabsTrigger value="context" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
                                        <Database className="w-4 h-4 mr-2" /> Context Loaded (RAG)
                                    </TabsTrigger>
                                </TabsList>
                                {results.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs border-green-500/30 text-green-400 bg-green-500/10 hidden sm:flex">
                                            <Zap className="w-3 h-3 mr-1" /> Active
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <TabsContent value="chat" className="flex-1 flex flex-col p-6 pt-4 mt-0 data-[state=inactive]:hidden">
                                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                                    <div className="bg-zinc-800/50 p-4 rounded-xl rounded-tl-none border border-white/5 self-start max-w-[80%]">
                                        <p className="text-zinc-300">
                                            Describe your goal. I will auto-detect the right skills and <strong>inject them into my context</strong> to avoid hallucinations.
                                        </p>
                                    </div>

                                    {query && (
                                        <div className="bg-purple-900/20 p-4 rounded-xl rounded-tr-none border border-purple-500/20 self-end ml-auto max-w-[80%]">
                                            <p className="text-white">{query}</p>
                                        </div>
                                    )}

                                    {results.length > 0 && !isTyping && (
                                        <div className="bg-zinc-800/50 p-4 rounded-xl rounded-tl-none border border-white/5 self-start max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <div className="flex items-center gap-2 mb-3 text-green-400">
                                                <Zap className="w-4 h-4" />
                                                <span className="text-sm font-semibold">Context Injected: {results.length} Skills</span>
                                            </div>
                                            <p className="text-xs text-zinc-500 mb-3">
                                                I have now read the technical manuals for these topics. I can answer specific questions about them.
                                            </p>

                                            {/* CONTEXT DEPLOY CTA */}
                                            <div className="mb-4">
                                                <DeployButton label="Deploy This Context (@mcp:context7)" icon={Zap} className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/50 from-transparent to-transparent shadow-none" />
                                            </div>

                                            <div className="space-y-2">
                                                {results.map((r, i) => (
                                                    <div key={r.skill.id} className="flex items-center gap-3 bg-black/20 p-2 rounded border border-white/5">
                                                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 shrink-0">
                                                            {(r.score * 10).toFixed(0)}% Match
                                                        </Badge>
                                                        <span className="text-sm text-zinc-200 truncate">{r.skill.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="relative mt-auto">
                                    <input
                                        type="text"
                                        placeholder="e.g., 'Build a secure API' or 'Deploy to AWS'..."
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-white placeholder:text-zinc-600"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="context" className="flex-1 p-0 mt-0 h-full overflow-hidden flex flex-col bg-black/40 data-[state=inactive]:hidden">
                                <div className="p-4 border-b border-white/5 bg-zinc-900/50 flex justify-between items-center">
                                    <p className="text-xs text-zinc-400">
                                        Exact <strong>JSON payload</strong> injected into AI context.
                                    </p>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-white" title="Copy to Clipboard">
                                        <Code className="w-3 h-3" />
                                    </Button>
                                </div>
                                <ScrollArea className="flex-1 p-4">
                                    {results.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-zinc-600 font-mono text-sm">
                                            // Waiting for input...
                                        </div>
                                    ) : (
                                        <pre className="text-xs font-mono text-blue-300 leading-relaxed whitespace-pre-wrap font-medium">
                                            {JSON.stringify(simulatedResponse, null, 2)}
                                        </pre>
                                    )}
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>

                {/* RIGHT: Live Visualization */}
                <div className="flex flex-col gap-6 overflow-hidden h-full">

                    {/* Stats / Header for Viz */}
                    <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-2">
                            <PlayCircle className={`w-5 h-5 ${results.length > 0 ? 'text-green-400' : 'text-zinc-600'}`} />
                            <h2 className="font-semibold text-lg">Dynamic Workflow</h2>
                        </div>

                        {/* WORKFLOW DEPLOY CTA */}
                        {results.length > 0 ? (
                            <DeployButton label="Deploy Workflow" icon={Zap} className="h-8 text-xs bg-white text-black hover:bg-zinc-200 from-white to-zinc-100 shadow-none text-black" />
                        ) : (
                            <Badge variant="secondary" className="bg-white/10 text-zinc-400">
                                0 Steps
                            </Badge>
                        )}
                    </div>

                    <ScrollArea className="flex-1 pr-6 -mr-6">
                        {results.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4 opacity-50">
                                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <p>Start typing to generate a workflow...</p>
                                <Button variant="outline" className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5" onClick={() => setQuery('Deploy a Next.js app to Vercel')}>
                                    Try "Deploy Next.js"
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-8 relative pl-8 py-4">
                                {/* Timeline Line */}
                                <div className="absolute left-[11px] top-6 bottom-6 w-px bg-gradient-to-b from-purple-500 via-purple-500/20 to-transparent" />

                                {workflow.map((step, idx) => (
                                    <div key={idx} className="relative animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>

                                        {/* Dot */}
                                        <div className="absolute -left-[29px] top-6 w-6 h-6 rounded-full bg-black border-2 border-purple-500 flex items-center justify-center z-10 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                                            <span className="text-[10px] font-bold text-white">{step.step}</span>
                                        </div>

                                        <Card className="bg-zinc-900/40 border-white/5 overflow-hidden group hover:border-purple-500/30 transition-all hover:bg-zinc-900/60">
                                            {/* Step Content */}
                                            <div className="p-5">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge variant="outline" className="mb-2 border-purple-500/30 text-purple-400 bg-purple-500/5">
                                                        {step.action}
                                                    </Badge>
                                                    <span className="text-xs text-zinc-500 font-mono">{results[idx].skill.category}</span>
                                                </div>

                                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                                    {step.skill}
                                                </h3>

                                                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                                    {step.description}
                                                </p>

                                                <div className="flex items-center gap-2 text-xs text-zinc-500 border-t border-white/5 pt-3 mt-2">
                                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                    <span>Risk Level: <span className={results[idx].skill.risk === 'high' ? 'text-red-400' : 'text-zinc-300'}>{results[idx].skill.risk}</span></span>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                ))}

                                {/* Final Success State */}
                                <div className="relative animate-in slide-in-from-right-4 duration-700 fade-in" style={{ animationDelay: '600ms' }}>
                                    <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-green-500 box-content border-4 border-black/50 shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                                    <div className="p-1 pl-0">
                                        <p className="text-green-400 font-medium text-sm">Goal Achievable</p>
                                    </div>
                                    <div className="mt-4">
                                        <DeployButton label="Execute with Skill7" icon={Zap} className="w-full bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10 from-white to-zinc-100 text-black" />
                                    </div>
                                </div>

                            </div>
                        )}
                    </ScrollArea>
                </div>

            </div>
        </div>
    );
}
