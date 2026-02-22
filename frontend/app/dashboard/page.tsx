"use client"

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
    ShieldCheck, Activity, Zap, AlertTriangle, TrendingUp,
    Database, FileText, GitBranch, Flame, Download,
    Bell, BellOff, Sun, Moon, ArrowUp, ArrowDown,
    CheckCircle2, XCircle, Clock, Globe, Cpu, Terminal, ArrowRight,
    Network, Settings, AlertCircle, Fingerprint
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import Link from 'next/link';

// ── Static AML metrics ────────────────────────────────────────
const AREA_DATA = [
    { t: '00h', flagged: 4, cleared: 4 },
    { t: '03h', flagged: 2, cleared: 2 },
    { t: '06h', flagged: 7, cleared: 6 },
    { t: '09h', flagged: 18, cleared: 14 },
    { t: '12h', flagged: 31, cleared: 24 },
    { t: '15h', flagged: 26, cleared: 21 },
    { t: '18h', flagged: 14, cleared: 12 },
    { t: '21h', flagged: 9, cleared: 8 },
];

const VIOLATION_DIST = [
    { name: 'CTR Threshold', value: 38, color: '#1aff8c' },
    { name: 'Structuring', value: 27, color: '#f59e0b' },
    { name: 'Cross-Border', value: 21, color: '#3b82f6' },
    { name: 'PII Exposure', value: 9, color: '#ef4444' },
    { name: 'Ghost Account', value: 5, color: '#8b5cf6' },
];

const SCAN_BARS = [
    { h: 'Mon', scans: 1240, violations: 31 },
    { h: 'Tue', scans: 980, violations: 19 },
    { h: 'Wed', scans: 1580, violations: 52 },
    { h: 'Thu', scans: 2100, violations: 67 },
    { h: 'Fri', scans: 1760, violations: 48 },
    { h: 'Sat', scans: 640, violations: 12 },
    { h: 'Sun', scans: 420, violations: 8 },
];

const LIVE_FEED: { time: string; msg: string; level: 'success' | 'warn' | 'error' | 'info'; id: string }[] = [
    { id: 'L1', time: '19:21:44', level: 'error', msg: '[BLOCK] AML-R02 · Structuring detected — ACC-8912 · $1,800×4 in 6h' },
    { id: 'L2', time: '19:21:02', level: 'warn', msg: '[WARN] AML-R05 · Tax-haven route detected — SWIFT: BOFIUS3N→KY' },
    { id: 'L3', time: '19:20:18', level: 'success', msg: '[PASS] 482 records scanned · 0 violations in last batch' },
    { id: 'L4', time: '19:19:55', level: 'error', msg: '[BLOCK] AML-R01 · CTR threshold exceeded — $14,200 wire · ACC-6671' },
    { id: 'L5', time: '19:19:11', level: 'info', msg: '[SYNC] N2L rules refreshed — 6 rules active' },
    { id: 'L6', time: '19:18:44', level: 'success', msg: '[PASS] Gemini synthesis complete — BSA §1010.310 → AML-R01 v3.2' },
    { id: 'L7', time: '19:17:30', level: 'warn', msg: '[WARN] AML-R04 · PII field unencrypted — ACC-3345' },
    { id: 'L8', time: '19:16:55', level: 'error', msg: '[BLOCK] AML-R03 · Cross-border flag — DE→US $6,700' },
    { id: 'L9', time: '19:16:00', level: 'info', msg: '[INFO] Database Sentinel heartbeat OK · IBM AML dataset online' },
];

const QUICK_LINKS = [
    { label: 'Database Sentinel', desc: 'Run AML scan', href: '/dashboard/sentinel', icon: Database, color: 'text-[#1aff8c]' },
    { label: 'Policy Vault', desc: 'Ingest regulation PDF', href: '/dashboard/policies', icon: FileText, color: 'text-blue-400' },
    { label: 'Rule Audit Log', desc: 'View N2L rules', href: '/dashboard/evaluate', icon: GitBranch, color: 'text-purple-400' },
    { label: 'Adversarial Hub', desc: 'Red team AML rules', href: '/dashboard/redteam', icon: Flame, color: 'text-orange-400' },
    { label: 'Violation Nexus', desc: 'Review & remediate', href: '/dashboard/remediate', icon: AlertTriangle, color: 'text-red-400' },
    { label: 'AML Analytics', desc: 'Trends & heatmaps', href: '/dashboard/sla', icon: TrendingUp, color: 'text-amber-400' },
];

const KPI = [
    {
        label: 'AML Trust Score', value: '94.2%', delta: '+2.5%', up: true,
        icon: ShieldCheck, color: 'text-[#1aff8c]', glow: 'rgba(26,255,140,0.15)'
    },
    {
        label: 'Records Scanned', value: '8,720', delta: '+12% today', up: true,
        icon: Database, color: 'text-blue-400', glow: 'rgba(59,130,246,0.12)'
    },
    {
        label: 'Violations Blocked', value: '237', delta: '2.7% block rate', up: false,
        icon: AlertTriangle, color: 'text-red-400', glow: 'rgba(239,68,68,0.12)'
    },
    {
        label: 'Avg Scan Latency', value: '84ms', delta: '99.9% uptime', up: true,
        icon: Zap, color: 'text-amber-400', glow: 'rgba(245,158,11,0.12)'
    },
];

const TOOLTIP_STYLE = {
    backgroundColor: '#0d1310',
    border: '1px solid rgba(26,255,140,0.15)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
};

const LEVEL_STYLE = {
    success: 'text-[#1aff8c]',
    error: 'text-red-400',
    warn: 'text-amber-400',
    info: 'text-[rgba(26,255,140,0.4)]',
};

const LEVEL_PREFIX = {
    success: '✓',
    error: '✕',
    warn: '⚠',
    info: '›',
};

const TABS = ['Overview', 'Analytics', 'Live Feed'];

export default function OverviewPage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('Overview');
    const [notif, setNotif] = useState(false);
    const [kpis, setKpis] = useState(KPI);
    const [liveFeed, setLiveFeed] = useState(LIVE_FEED);
    const [systemOnline, setSystemOnline] = useState(true);
    const [violationDist, setViolationDist] = useState(VIOLATION_DIST);

    useEffect(() => {
        setMounted(true);

        // Poll live violations for Live Feed tab
        async function fetchLiveFeed() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/sentinel/violations`);
                if (!res.ok) return;
                const violations: any[] = await res.json();
                if (violations.length > 0) {
                    const entries = violations.slice(-9).reverse().map((v: any, i: number) => ({
                        id: `V${i}`,
                        time: new Date(v.timestamp || Date.now()).toLocaleTimeString(),
                        level: (v.verdict === 'FLAGGED' ? 'error' : 'success') as 'error' | 'success' | 'warn' | 'info',
                        msg: v.verdict === 'FLAGGED'
                            ? `[BLOCK] ${v.transaction_id} → ${v.detections?.[0]?.rule_label || 'AML Violation'} · Risk: ${v.detections?.[0]?.severity || 'HIGH'}`
                            : `[PASS] ${v.transaction_id} → COMPLIANT`,
                    }));
                    setLiveFeed(entries);

                    // Update violation distribution from real data
                    const labelCounts: Record<string, number> = {};
                    violations.forEach((v: any) => {
                        const label = v.detections?.[0]?.rule_label || 'Other';
                        labelCounts[label] = (labelCounts[label] || 0) + 1;
                    });
                    const colors = ['#1aff8c', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];
                    const dist = Object.entries(labelCounts).map(([name, value], i) => ({
                        name, value, color: colors[i % colors.length]
                    }));
                    if (dist.length > 0) setViolationDist(dist);
                }
            } catch { }
        }

        // Check backend /health
        async function checkHealth() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/health`);
                setSystemOnline(res.ok);
            } catch { setSystemOnline(false); }
        }

        async function fetchStats() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/dashboard/stats`);
                if (!response.ok) throw new Error("Failed to fetch");
                const data = await response.json();

                const tracesAnalyzed = data.traces_analyzed ?? data.records_scanned ?? 0;
                const violations = data.violations ?? data.violations_blocked ?? 0;
                const systemHealth = data.system_health ?? data.health ?? 94.2;
                const latency = data.avg_latency_ms ? `${data.avg_latency_ms}ms` : '84ms';
                const uptime = data.uptime ?? '99.9%';
                setKpis([
                    { ...KPI[0], value: `${systemHealth}%`, delta: violations === 0 ? '+0 violations' : `-${violations} flagged` },
                    { ...KPI[1], value: tracesAnalyzed.toLocaleString(), delta: `${data.active_policies ?? 0} policies active` },
                    { ...KPI[2], value: violations.toLocaleString(), delta: `${((violations / (tracesAnalyzed || 1)) * 100).toFixed(1)}% block rate` },
                    { ...KPI[3], value: latency, delta: `${uptime} uptime` },
                ]);

            } catch (err) {
                console.error("Dashboard stats error:", err);
            }
        }
        fetchStats();
        fetchLiveFeed();
        checkHealth();
        const poll = setInterval(() => { fetchStats(); fetchLiveFeed(); checkHealth(); }, 5000);
        return () => clearInterval(poll);
    }, []);

    return (
        <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="sentinel-badge">Active Sentinel</span>
                        <span className="text-xs text-muted-foreground font-mono">IBM AML · 6 rules live</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Real-time AML compliance oversight — powered by Lexinel's N2L enforcement engine.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Tabs */}
                    <div className="flex bg-[rgba(26,255,140,0.04)] border border-[rgba(26,255,140,0.1)] p-0.5 rounded-lg">
                        {TABS.map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === t
                                    ? 'bg-[#1aff8c] text-[#070c0a]'
                                    : 'text-muted-foreground hover:text-foreground'}`}>
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* Notification toggle */}
                    <button
                        onClick={async () => {
                            if (!notif) {
                                const p = await Notification.requestPermission();
                                if (p === 'granted') setNotif(true);
                            } else {
                                setNotif(false);
                            }
                        }}
                        className={`p-2 rounded-lg border transition-all ${notif
                            ? 'border-[rgba(26,255,140,0.3)] text-[#1aff8c] bg-[rgba(26,255,140,0.08)]'
                            : 'border-border text-muted-foreground hover:border-[rgba(26,255,140,0.2)]'}`}
                        title={notif ? 'Notifications active' : 'Enable notifications'}
                    >
                        {notif ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </button>

                    {/* Theme toggle */}
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-lg border border-border text-muted-foreground hover:border-[rgba(26,255,140,0.2)] transition-all"
                        >
                            {theme === 'dark'
                                ? <Sun className="w-4 h-4" />
                                : <Moon className="w-4 h-4" />}
                        </button>
                    )}

                    {/* Export */}
                    <button
                        onClick={() => alert('Export coming soon — connect backend to enable PDF dossier.')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[#070c0a] transition-all"
                        style={{ background: '#1aff8c', boxShadow: '0 0 16px rgba(26,255,140,0.3)' }}
                    >
                        <Download className="w-3.5 h-3.5" /> Export Dossier
                    </button>
                </div>
            </div>

            {/* ── KPI Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((k, i) => (
                    <div key={i} className="glass-card rounded-xl p-4"
                        style={{ boxShadow: `0 0 20px ${k.glow}, inset 0 0 20px ${k.glow}` }}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">{k.label}</p>
                            <k.icon className={`w-4 h-4 ${k.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{k.value}</p>
                        <p className={`text-xs flex items-center gap-1 mt-1 ${k.up ? 'text-[#1aff8c]' : 'text-muted-foreground'}`}>
                            {k.up ? <ArrowUp className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                            {k.delta}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── OVERVIEW TAB (THE CONTROL ROOM) ─────────────────────────── */}
            {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                    {/* LEFT: Governance Nexus (Lineage Flow) */}
                    <div className="xl:col-span-8 space-y-8">

                        {/* 1. The Governance Nexus - NEW CONCEPT */}
                        <div className="glass-card rounded-2xl p-8 border border-[rgba(26,255,140,0.15)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                                <Network className="w-64 h-64 text-[#1aff8c]" />
                            </div>

                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-[0.2em]">Governance Nexus</h3>
                                    <p className="text-xs text-muted-foreground font-mono mt-1">&gt; Neural-to-Logic (N2L) Lineage Flow</p>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(26,255,140,0.05)] border border-[rgba(26,255,140,0.2)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1aff8c] animate-pulse" />
                                    <span className="text-[10px] font-black text-[#1aff8c] uppercase tracking-widest">Enforcement Active</span>
                                </div>
                            </div>

                            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                                {/* Step 1: Ingest */}
                                <div className="z-10 flex flex-col items-center gap-4 group w-full md:w-1/4">
                                    <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-white/10 flex items-center justify-center group-hover:border-[rgba(26,255,140,0.5)] transition-all">
                                        <FileText className="w-7 h-7 text-zinc-500 group-hover:text-[#1aff8c]" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[11px] font-black text-white uppercase tracking-wider">Regulatory Ingest</p>
                                        <p className="text-[9px] text-muted-foreground mt-1">BSA / FATF / EU PDFS</p>
                                    </div>
                                </div>

                                <div className="hidden md:block w-full h-px bg-gradient-to-r from-transparent via-[rgba(26,255,140,0.3)] to-transparent relative">
                                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-[#1aff8c] animate-[move_3s_linear_infinite]" style={{ left: '0%' }} />
                                </div>

                                {/* Step 2: N2L Synthesis */}
                                <div className="z-10 flex flex-col items-center gap-4 group w-full md:w-1/4">
                                    <div className="w-20 h-20 rounded-full bg-[rgba(26,255,140,0.05)] border-2 border-[rgba(26,255,140,0.2)] flex items-center justify-center relative shadow-[0_0_30px_rgba(26,255,140,0.1)] group-hover:border-[#1aff8c] transition-all">
                                        <Cpu className="w-8 h-8 text-[#1aff8c] animate-pulse" />
                                        <div className="absolute inset-0 rounded-full border border-[#1aff8c] opacity-20 animate-ping" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[11px] font-black text-white uppercase tracking-wider">N2L Synthesis</p>
                                        <p className="text-[9px] text-[#1aff8c] mt-1 font-mono uppercase">Gemini 3 Pro Live</p>
                                    </div>
                                </div>

                                <div className="hidden md:block w-full h-px bg-gradient-to-r from-transparent via-[rgba(26,255,140,0.3)] to-transparent" />

                                {/* Step 3: Deployment */}
                                <div className="z-10 flex flex-col items-center gap-4 group w-full md:w-1/4">
                                    <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-white/10 flex items-center justify-center group-hover:border-[#3b82f6] transition-all">
                                        <ShieldCheck className="w-7 h-7 text-zinc-500 group-hover:text-blue-400" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[11px] font-black text-white uppercase tracking-wider">Policy Sentinel</p>
                                        <p className="text-[9px] text-muted-foreground mt-1 font-mono">Real-time Blocking</p>
                                    </div>
                                </div>
                            </div>

                            <style jsx>{`
                                @keyframes move {
                                    0% { left: 0%; opacity: 0; }
                                    10% { opacity: 1; }
                                    90% { opacity: 1; }
                                    100% { left: 100%; opacity: 0; }
                                }
                            `}</style>
                        </div>

                        {/* 2. Audit Spotlight Card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            <div className="glass-card rounded-2xl p-6 border border-red-500/20 bg-gradient-to-br from-[#070c0a] to-[#0d0707] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <AlertCircle className="w-20 h-20 text-red-500" />
                                </div>
                                <h3 className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                    <Flame className="w-3.5 h-3.5" /> High Risk Spotlight
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-xs font-bold text-white tracking-widest uppercase">ACC-8912</p>
                                            <span className="px-2 py-0.5 rounded bg-red-500 text-[8px] font-black text-white uppercase">Critical</span>
                                        </div>
                                        <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                                            Detect structuring pattern: <span className="text-red-300">$1,800 × 4</span> transactions within 6 hours. High correlation with CTR evasion.
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <Link href="/dashboard/remediate" className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 flex items-center gap-1 transition-all">
                                                Remediate <ArrowRight className="w-2.5 h-2.5" />
                                            </Link>
                                            <div className="h-3 w-px bg-white/10" />
                                            <p className="text-[9px] font-mono text-zinc-600 tracking-widest">19:21:44 UTC</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card rounded-2xl p-6 border border-[rgba(26,255,140,0.1)] relative">
                                <h3 className="text-[10px] font-black text-[#1aff8c] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                    <Fingerprint className="w-3.5 h-3.5" /> Compliance Integrity
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { l: 'Zero-Trust Kernel', s: 'Active', c: 'text-[#1aff8c]' },
                                        { l: 'PII MASKING (V3)', s: 'Enabled', c: 'text-blue-400' },
                                        { l: 'Self-Healing Hook', s: 'Dormant', c: 'text-zinc-600' },
                                        { l: 'Audit Log Chain', s: 'Verified', c: 'text-[#1aff8c]' },
                                    ].map((row, i) => (
                                        <div key={i} className="flex items-center justify-between border-b border-white/[0.03] pb-2 last:border-0 last:pb-0">
                                            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">{row.l}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${row.c}`}>{row.s}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-4 border-t border-white/[0.05]">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[9px] text-zinc-500 font-mono italic">Signature: LV-331-SENTINEL-X</p>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1aff8c] opacity-40" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* RIGHT: Active Sentinels & Quick Controls */}
                    <div className="xl:col-span-4 space-y-8">

                        {/* 3. Live Control Panel */}
                        <div className="glass-card rounded-2xl p-6 border border-[rgba(26,255,140,0.1)] h-full">
                            <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                                <span>Policy Control Grid</span>
                                <Settings className="w-4 h-4 text-zinc-600" />
                            </h3>

                            <div className="space-y-3 mb-8">
                                {[
                                    { name: 'BSA CTR Sentinel', val: '99%', color: '#1aff8c', active: true },
                                    { name: 'FATF Cross-Border', val: '84%', color: '#fbbf24', active: true },
                                    { name: 'EU-AMLD Routing', val: '0%', color: '#52525b', active: false },
                                    { name: 'GDPR PII Shield', val: '92%', color: '#3b82f6', active: true },
                                ].map((ctrl, i) => (
                                    <div key={ctrl.name} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] group hover:border-[rgba(26,255,140,0.2)] transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[11px] font-black text-white uppercase tracking-wider">{ctrl.name}</p>
                                            <div className={`w-8 h-4 rounded-full p-0.5 relative cursor-pointer ${ctrl.active ? 'bg-[#1aff8c]/20 border border-[#1aff8c]/30' : 'bg-zinc-800 border border-zinc-700'}`}>
                                                <div className={`w-2.5 h-2.5 rounded-full transition-all ${ctrl.active ? 'bg-[#1aff8c] ml-auto' : 'bg-zinc-500 ml-0'}`} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: ctrl.val, backgroundColor: ctrl.color }} />
                                            </div>
                                            <span className="text-[9px] font-mono text-zinc-500 w-6 text-right">{ctrl.val}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full py-3 rounded-xl border border-[rgba(26,255,140,0.3)] bg-[rgba(26,255,140,0.04)] text-[10px] font-black text-[#1aff8c] uppercase tracking-[0.2em] hover:bg-[rgba(26,255,140,0.08)] transition-all">
                                Initialize Global Re-Scan
                            </button>

                            <div className="mt-8 pt-6 border-t border-white/[0.05]">
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-4">Quick Links</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {QUICK_LINKS.slice(0, 4).map((q, i) => (
                                        <Link key={i} href={q.href}
                                            className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-[rgba(26,255,140,0.2)] transition-all flex items-center justify-center">
                                            <q.icon className={`w-4 h-4 ${q.color}`} />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* ── ANALYTICS TAB ──────────────────────────────────── */}
            {activeTab === 'Analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Hourly flag/clear area chart */}
                    <div className="lg:col-span-2 glass-card rounded-xl p-5">
                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#1aff8c]" /> 24h Violation Trend
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={AREA_DATA}>
                                <defs>
                                    <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1aff8c" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#1aff8c" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,255,140,0.06)" />
                                <XAxis dataKey="t" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Area type="monotone" dataKey="flagged" stroke="#1aff8c" fill="url(#fg)" strokeWidth={2} name="Flagged" />
                                <Area type="monotone" dataKey="cleared" stroke="#3b82f6" fill="url(#cg)" strokeWidth={2} name="Cleared" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Violation type pie */}
                    <div className="glass-card rounded-xl p-5">
                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#1aff8c]" /> By Violation Type
                        </h3>
                        <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                                <Pie data={violationDist} cx="50%" cy="50%" innerRadius={42} outerRadius={68}
                                    paddingAngle={3} dataKey="value">
                                    {violationDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 mt-2">
                            {violationDist.map((v, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: v.color }} />
                                        <span className="text-muted-foreground">{v.name}</span>
                                    </span>
                                    <span className="font-bold text-foreground">{v.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weekly scan bar */}
                    <div className="lg:col-span-3 glass-card rounded-xl p-5">
                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <Database className="w-4 h-4 text-[#1aff8c]" /> Weekly Scan Volume vs Violations
                        </h3>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={SCAN_BARS}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,255,140,0.06)" />
                                <XAxis dataKey="h" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Bar dataKey="scans" fill="rgba(26,255,140,0.25)" radius={[3, 3, 0, 0]} name="Records Scanned" />
                                <Bar dataKey="violations" fill="#1aff8c" radius={[3, 3, 0, 0]} name="Violations" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ── LIVE FEED TAB ───────────────────────────────────── */}
            {activeTab === 'Live Feed' && (
                <div className="glass-card rounded-xl overflow-hidden">
                    {/* Terminal header */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-[#030806] border-b border-[rgba(26,255,140,0.08)]">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#1aff8c]/60" />
                        </div>
                        <span className="text-[10px] font-mono text-[rgba(26,255,140,0.4)] ml-2">lexinel.sentinel — live-enforcement-stream</span>
                        <div className="ml-auto flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#1aff8c] animate-pulse" />
                            <span className="text-[10px] text-[#1aff8c] font-mono">LIVE</span>
                        </div>
                    </div>

                    {/* Feed entries */}
                    <div className="bg-[#030806] font-mono text-xs divide-y divide-[rgba(26,255,140,0.04)]">
                        {liveFeed.length === 0 ? (
                            <div className="px-5 py-4 text-[rgba(26,255,140,0.3)]">&gt; Run a Sentinel scan to populate the live feed...</div>
                        ) : liveFeed.map(e => (
                            <div key={e.id} className="flex items-start gap-3 px-5 py-2.5 hover:bg-[rgba(26,255,140,0.02)] transition-colors">
                                <span className="text-[rgba(26,255,140,0.3)] flex-shrink-0 w-16">{e.time}</span>
                                <span className={`flex-shrink-0 ${LEVEL_STYLE[e.level]}`}>{LEVEL_PREFIX[e.level]}</span>
                                <span className={LEVEL_STYLE[e.level]}>{e.msg}</span>
                            </div>
                        ))}
                    </div>

                    <div className="px-5 py-3 bg-[#030806] border-t border-[rgba(26,255,140,0.08)] text-center">
                        <Link href="/dashboard/monitor"
                            className="text-xs text-[#1aff8c] font-bold hover:text-[#0de87a] transition-colors">
                            → Open Full Live Scan Feed
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
