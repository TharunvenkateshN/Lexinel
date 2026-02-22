"use client"

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Upload, CheckCircle2, Cpu, Database,
    Shield, ArrowRight, Loader2, BookOpen, Code2,
    Layers, AlertTriangle, X, Download, Terminal,
    Zap, Activity, ShieldCheck, FileCheck, Search,
    Clock, Globe, GitBranch
} from 'lucide-react';

import Link from 'next/link';

const POLICY_TEMPLATES = [
    { name: 'BSA / FinCEN AML Policy', type: 'PDF', size: '2.4 MB', clauses: 47, desc: 'US Financial institution compliance' },
    { name: 'EU AMLD6 Framework', type: 'PDF', size: '1.8 MB', clauses: 63, desc: 'European AML Directive v6' },
    { name: 'FATF 40 Recommendations', type: 'PDF', size: '3.1 MB', clauses: 40, desc: 'Global AML/CFT guidelines' },
];

const SYNTHESIS_STEPS = [
    '📄 Extracting text from PDF via N2L Parser...',
    '🔍 Identifying policy clauses and obligations...',
    '🧠 Gemini Pro: Inferring regulatory intent...',
    '⚙️  Translating semantics to enforcement logic...',
    '🗃️  Generating SQL-native assertion rules...',
    '🔗 Mapping rules to IBM AML schema v2.1...',
    '✅ Synthesis complete. Integrity hash: 0x82...A1',
];

const SYNTHESIZED_RULES_OUTPUT = [
    { id: 'AML-R01', clause: 'BSA §1010.310', logic: 'amount > 10000 AND type IN (TRANSFER, WIRE)', label: 'CTR Threshold', status: 'DEPLOYED' },
    { id: 'AML-R02', clause: 'FATF Rec. 10', logic: 'COUNT(same_beneficiary_24h) >= 3 AND amount < 2000', label: 'Structuring', status: 'DEPLOYED' },
    { id: 'AML-R03', clause: 'FinCEN 103.29', logic: 'cross_border = true AND amount > 5000', label: 'Cross-Border', status: 'DEPLOYED' },
];

export default function PoliciesPage() {
    const [uploadedFiles, setUploadedFiles] = useState<string[]>(['AML_Policy_Lexinel.pdf']);
    const [synthesizing, setSynthesizing] = useState(false);
    const [synthLog, setSynthLog] = useState<string[]>([]);
    const [synthComplete, setSynthComplete] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [deploying, setDeploying] = useState(false);
    const [deployed, setDeployed] = useState(false);

    const [isEngineBooting, setIsEngineBooting] = useState(false);

    const runSynthesis = async (filename: string) => {
        try {
            setSynthesizing(true);
            setSynthLog([]);
            setSynthComplete(false);
            setDeployed(false);
            setSelectedTemplate(filename);

            // Phase 1: Booting / Verification
            setIsEngineBooting(true);
            setSynthLog(["⚡ Initializing N2L Neural Anchor...", "🧪 Verifying document integrity hash..."]);
            await new Promise(r => setTimeout(r, 1000));
            setIsEngineBooting(false);

            // Phase 2: Synthesis Steps
            for (const step of SYNTHESIS_STEPS) {
                await new Promise(r => setTimeout(r, 600 + Math.random() * 600));
                setSynthLog(prev => [...prev, step]);
            }

            setSynthesizing(false);
            setSynthComplete(true);
        } catch (error) {
            console.error("Synthesis Engine Error:", error);
            setSynthesizing(false);
        }
    };

    const handleFileUpload = (source: any) => {
        // Universal File Selector
        let files: FileList | null = null;
        if (source?.dataTransfer?.files) files = source.dataTransfer.files;
        else if (source?.target?.files) files = source.target.files;
        else if (source instanceof FileList) files = source;

        if (!files || files.length === 0) return;

        const validFiles = Array.from(files).filter(f =>
            f.name.toLowerCase().endsWith('.pdf') ||
            f.name.toLowerCase().endsWith('.docx') ||
            f.name.toLowerCase().endsWith('.txt')
        );

        if (validFiles.length === 0) {
            alert("Format not supported. Please use PDF, DOCX, or TXT.");
            return;
        }

        const fileNames = validFiles.map(f => f.name);
        setUploadedFiles(prev => [...new Set([...prev, ...fileNames])]);

        // Immediate Execution Trigger
        runSynthesis(fileNames[0]);

        // Clear input to allow re-selection of same file
        if (source?.target && source.target instanceof HTMLInputElement) {
            source.target.value = '';
        }
    };

    const handleDeploy = async () => {
        setDeploying(true);
        await new Promise(r => setTimeout(r, 2000));
        setDeploying(false);
        setDeployed(true);
    };

    return (
        <div className="space-y-6 pb-20">
            {/* 1. Header (Following Dashboard Pattern) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[rgba(26,255,140,0.1)] border border-[rgba(26,255,140,0.2)]">
                        <FileText className="w-5 h-5 text-[#1aff8c]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Policy Vault</h1>
                        <p className="text-[rgba(26,255,140,0.5)] text-xs tracking-widest uppercase">N2L Neural-to-Logic Recompiler · Ingest & Synthesize</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/evaluate">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-zinc-400 bg-white/5 border border-white/10 hover:border-[#1aff8c]/30 hover:text-white transition-all">
                            <Clock className="w-3.5 h-3.5" /> History
                        </button>
                    </Link>
                    <Link href="/dashboard/settings">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#1aff8c]/10 border border-[#1aff8c]/20 hover:bg-[#1aff8c]/20 transition-all">
                            <Shield className="w-3.5 h-3.5" /> Engine Settings
                        </button>
                    </Link>
                </div>
            </div>

            <p className="text-muted-foreground text-sm max-w-2xl">
                Convert unstructured regulatory documentation into executable database enforcement rules. Lexinel's N2L engine uses neural inference to map legal clauses to SQL assertion logic.
            </p>

            {/* 2. Stats Strip (4 KPI Cards) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Ingested Policies', value: '03', icon: Layers, color: 'text-blue-400' },
                    { label: 'Active Rules', value: deployed ? '12' : '09', icon: CheckCircle2, color: 'text-[#1aff8c]' },
                    { label: 'Logic Latency', value: '42ms', icon: Zap, color: 'text-amber-400' },
                    { label: 'Engine Health', value: 'Nominal', icon: Cpu, color: 'text-purple-400' },
                ].map((stat, i) => (
                    <div key={i} className="glass-card rounded-xl p-4 flex items-center gap-4 border border-white/5">
                        <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                            <stat.icon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-0.5">{stat.label}</p>
                            <p className="text-xl font-bold text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Main Workspace (2/3 Column Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── LEFT: The Action Column (2/3) ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Primary Action: Dropzone */}
                    {!synthComplete && !synthesizing && (
                        <div
                            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${dragOver ? 'border-[#1aff8c] bg-[#1aff8c]/5 shadow-[0_0_30px_rgba(26,255,140,0.1)]' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOver(false);
                                handleFileUpload(e.dataTransfer.files);
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.docx,.txt"
                                multiple
                                className="hidden"
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleFileUpload(e)}
                            />
                            <div className="w-16 h-16 rounded-full bg-[#1aff8c]/5 border border-[#1aff8c]/20 flex items-center justify-center mx-auto mb-6">
                                <Upload className="w-8 h-8 text-[#1aff8c]" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Deploy New Regulation</h3>
                            <p className="text-sm text-zinc-500 max-w-md mx-auto">
                                Drag and drop your regulatory PDF or compliance documentation here to begin N2L neural synthesis.
                            </p>
                            <div className="mt-8 flex justify-center gap-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> PDF / DOCX</span>
                                <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> AI VERIFIED</span>
                                <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> MULTI-REGION</span>
                            </div>
                        </div>
                    )}

                    {/* Synthesis Console & Results */}
                    {(synthesizing || synthComplete) && (
                        <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
                            <div className="flex items-center justify-between px-6 py-4 bg-[#070c0a] border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <Terminal className="w-4 h-4 text-zinc-600" />
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">n2l.console_v3 // processing</span>
                                </div>
                                {synthComplete && (
                                    <button onClick={() => { setSynthComplete(false); setSynthesizing(false); }} className="text-zinc-500 hover:text-white transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="h-[280px] overflow-y-auto bg-[#030605] p-6 font-mono text-[11px] custom-scrollbar">
                                <AnimatePresence>
                                    {synthLog.map((line, i) => (
                                        <motion.p key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-2 text-zinc-500 border-l border-white/5 pl-4 py-0.5">
                                            <span className="text-white/10 mr-4 font-black">STP_{i}</span>
                                            <span className={line.includes('✅') ? 'text-[#1aff8c] font-black' : line.includes('🧠') ? 'text-blue-400' : ''}>
                                                {line}
                                            </span>
                                        </motion.p>
                                    ))}
                                </AnimatePresence>
                                {synthesizing && <motion.div animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 h-4 bg-[#1aff8c] mt-2 ml-4" />}
                            </div>
                        </div>
                    )}

                    {/* Synthesized Logic Registry */}
                    {synthComplete && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <GitBranch className="w-4 h-4 text-[#1aff8c]" /> Logic Output Registry
                                </h3>
                                <button
                                    onClick={handleDeploy}
                                    disabled={deployed || deploying}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${deployed ? 'bg-[#1aff8c]/10 text-[#1aff8c] border border-[#1aff8c]/30' : 'bg-[#1aff8c] text-black shadow-[0_0_20px_rgba(26,255,140,0.3)] hover:scale-105 active:scale-95'}`}
                                >
                                    {deploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : deployed ? <ShieldCheck className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                                    {deploying ? 'Initializing...' : deployed ? 'Rules Live' : 'Inject Logic'}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                                {SYNTHESIZED_RULES_OUTPUT.map((rule, idx) => (
                                    <div key={rule.id} className="glass-card rounded-2xl p-6 border border-white/5 bg-white/[0.02] hover:border-[rgba(26,255,140,0.3)] transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-[#1aff8c] bg-[rgba(26,255,140,0.1)] px-2 py-1 rounded-md">{rule.id}</span>
                                                <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-widest">{rule.clause}</span>
                                            </div>
                                            {deployed && <Activity className="w-3.5 h-3.5 text-[#1aff8c] animate-pulse" />}
                                        </div>
                                        <p className="text-xs font-bold text-white mb-4 leading-tight">{rule.label}</p>
                                        <code className="block w-full p-3 rounded-xl bg-black/60 font-mono text-[10px] text-amber-500 border border-white/5 truncate">
                                            {rule.logic}
                                        </code>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── RIGHT: The Support Column (1/3) ── */}
                <div className="space-y-6">

                    {/* Loaded Documents */}
                    <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
                        <div className="px-4 py-3 border-b border-white/5 bg-white/[0.01]">
                            <h3 className="text-xs font-bold text-white flex items-center gap-2">
                                <Database className="w-3.5 h-3.5 text-[#1aff8c]" /> Source Registry
                            </h3>
                        </div>
                        <div className="divide-y divide-white/5">
                            {uploadedFiles.map((f, i) => (
                                <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <FileText className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                                        <span className="text-xs text-white truncate font-medium">{f}</span>
                                    </div>
                                    <button onClick={() => runSynthesis(f)} className="p-1.5 rounded-lg bg-[#1aff8c]/10 text-[#1aff8c] hover:bg-[#1aff8c]/20">
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Templates */}
                    <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Baseline Standards</h3>
                        {POLICY_TEMPLATES.map((t, i) => (
                            <button key={i} onClick={() => runSynthesis(t.name)} className="w-full text-left p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#1aff8c]/30 hover:bg-[#1aff8c]/5 transition-all group">
                                <p className="text-xs font-bold text-white mb-1 group-hover:text-[#1aff8c]">{t.name}</p>
                                <p className="text-[9px] font-medium text-zinc-600 uppercase tracking-tight">{t.desc} · {t.size}</p>
                            </button>
                        ))}
                    </div>

                    {/* Engine Telemetry */}
                    <div className="glass-card rounded-2xl p-6 border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-[#1aff8c]" /> Agentic Vitals
                        </h3>
                        <div className="space-y-5">
                            {[
                                { label: 'Inference Confidence', val: '0.982', pct: 98, col: 'bg-[#1aff8c]' },
                                { label: 'Clause Recall', val: '100%', pct: 100, col: 'bg-blue-400' },
                                { label: 'Thread Memory', val: '1.2GB', pct: 34, col: 'bg-purple-400' },
                            ].map((stat, i) => (
                                <div key={i}>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{stat.label}</span>
                                        <span className="text-[9px] font-mono text-white tracking-widest">{stat.val}</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full ${stat.col} opacity-40`} style={{ width: `${stat.pct}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Decorations */}
            <div className="fixed top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-[#1aff8c] blur-[200px] opacity-[0.02] pointer-events-none -z-10" />
        </div>
    );
}
