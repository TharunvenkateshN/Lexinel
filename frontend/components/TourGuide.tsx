"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowRight, ArrowLeft, CheckCircle, ShieldAlert, Zap, Globe, X,
    LayoutDashboard, FileText, Activity, Target as TargetIcon,
    Shield, Server, Box, Wrench, Lightbulb, Brain, TrendingUp, Code2
} from 'lucide-react';

const TOUR_STEPS = [
    {
        id: 1,
        route: '/dashboard',
        selector: '#dashboard-title',
        badge: "Control Center • 1/8",
        title: "Lexinel AML Compliance Hub",
        desc: "Welcome to Lexinel. This is your unified command center. At a glance, you can see active policies, total evaluations, and real-time violations detected. Everything feeds into this view.",
        icon: LayoutDashboard,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10"
    },
    {
        id: 2,
        route: '/dashboard/policies',
        selector: '#upload-policy-card',
        badge: "N2L Synthesis • 2/8",
        title: "Neural-to-Logic (N2L) Engine",
        desc: "Traditionally, compliance rules take months to code. Here, you upload a regulatory PDF, and our N2L engine uses Gemini to instantly extract clauses and synthesize them into live enforcement rules.",
        icon: FileText,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        action: '#upload-policy-card',
        interactiveAction: {
            label: "Try Sample Policy",
            target: "#try-sample-policy-btn"
        },
        duration: 3000
    },
    {
        id: 3,
        route: '/dashboard/policies',
        selector: '#rule-audit-log',
        badge: "Governance • 3/8",
        title: "Rule Audit & Hit Rates",
        desc: "These are your live synthesized rules. Each card maps to a compliance framework (like BSA) and shows a live 'hit rate' giving you total visibility into how often a rule catches a violation.",
        icon: Shield,
        color: "text-indigo-400",
        bg: "bg-indigo-500/10"
    },
    {
        id: 4,
        route: '/dashboard/proxy',
        selector: '#sentinel-launch-btn',
        badge: "Enforcement • 4/8",
        title: "The Database Sentinel",
        desc: "When launched, the Sentinel scans thousands of live transactions. When it detects a violation—like a smurfing pattern or an OFAC hit—it flags it instantly in real-time.",
        icon: Zap,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        action: '#sentinel-launch-btn'
    },
    {
        id: 5,
        route: '/dashboard/evaluate',
        selector: '#auto-sar-btn',
        badge: "Reporting • 5/8",
        title: "Auto-SAR Generation",
        desc: "Violations require paperwork. Click 'Draft SAR' and Gemini steps in as a Senior Investigator to automatically draft a FinCEN-ready Suspicious Activity Report narrative, saving hours of manual work.",
        icon: FileText,
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        action: '#auto-sar-btn'
    },
    {
        id: 6,
        route: '/dashboard/redteam',
        selector: '#adversarial-hub-card',
        badge: "Safety • 6/8",
        title: "Adversarial Hub",
        desc: "Security is built-in. Use the Adversarial Hub to red-team your own AI. Our deterministic PolicyGuard layer prevents prompt injection and blocks outputs before they happen.",
        icon: TargetIcon,
        color: "text-red-500",
        bg: "bg-red-500/10"
    },
    {
        id: 7,
        route: '/dashboard/redteam',
        selector: '#system-freeze-btn',
        badge: "Control • 7/8",
        title: "System Safety Freeze",
        desc: "In the event of a critical breach or policy drift, the Safety Freeze button allows compliance officers to remotely lock the entire AI agent instantly with zero drift.",
        icon: ShieldAlert,
        color: "text-red-400",
        bg: "bg-red-500/10"
    },
    {
        id: 8,
        route: '/dashboard',
        selector: '#chat-widget-trigger',
        badge: "Assist • 8/8",
        title: "Ask Lexinel",
        desc: "Finally, Lexinel is conversational. Ask complex compliance questions, and the AI will respond using only the exact policy context you've uploaded (RAG). Compliance, at the speed of thought.",
        icon: Brain,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        actionBtn: "Finish Tour"
    }
];

export function TourGuide() {
    const [stepIndex, setStepIndex] = useState(-1);
    const [isAutoPilot, setIsAutoPilot] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const [isHovered, setIsHovered] = useState(false);
    const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);
    const highlightTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const autoAdvanceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const checkTourStatus = () => {
            const tourActive = localStorage.getItem('pg_tour_active');
            if (tourActive === 'true' && stepIndex === -1) {
                setStepIndex(0);
            }
        };

        const handleStartTour = () => {
            setStepIndex(0);
        };

        checkTourStatus();

        window.addEventListener('pg-start-tour', handleStartTour);
        window.addEventListener('focus', checkTourStatus);
        return () => {
            window.removeEventListener('pg-start-tour', handleStartTour);
            window.removeEventListener('focus', checkTourStatus);
        };
    }, [pathname, stepIndex]);

    // Auto-Advance Logic (Auto-Pilot)
    useEffect(() => {
        if (stepIndex >= 0 && isAutoPilot && !isHovered) {
            if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);

            // Wait dynamic duration (default 8s) before moving to next step
            const duration = (TOUR_STEPS[stepIndex] as any).duration || 8000;
            autoAdvanceTimerRef.current = setTimeout(() => {
                nextStep();
            }, duration);
        }
        return () => {
            if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        };
    }, [stepIndex, isAutoPilot, isHovered]);

    // Handle Page Changes, Scrolling, and AUTOMATION
    useEffect(() => {
        if (stepIndex >= 0 && stepIndex < TOUR_STEPS.length) {
            const step = TOUR_STEPS[stepIndex];

            // 1. Navigation Check
            const isMarketingPage = ['/', '/features', '/governance', '/pricing', '/team', '/login', '/signup'].includes(pathname);
            if (pathname !== step.route && !isMarketingPage) {
                router.push(step.route);
                setHighlightElement(null); // Clear highlight during transit
                return;
            }

            // If on marketing page, don't try to highlight dash elements
            if (isMarketingPage && pathname !== step.route) {
                setHighlightElement(null);
                return;
            }

            // 2. Highlighting & Scrolling with persistent retry
            const locateAndHighlight = () => {
                const el = document.querySelector(step.selector) as HTMLElement;
                if (el) {
                    if (step.selector.includes('tab') && el.getAttribute('aria-selected') === 'false') {
                        el.click();
                    }

                    // AUTO-SCROLL TO RESULT
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setHighlightElement(el);

                    // 3. AUTOMATION ACTIONS (The "Self-Driving" Logic)
                    if (step.action) {
                        setTimeout(() => {
                            const actionTarget = document.querySelector(step.action!) as HTMLElement;
                            if (actionTarget) {
                                console.log(`Tour Guide: Executing auto-action on ${step.action}`);
                                actionTarget.click();
                            }
                        }, 1000); // Wait 1s after highlight to click
                    }

                } else {
                    highlightTimerRef.current = setTimeout(locateAndHighlight, 500);
                }
            };

            const timer = setTimeout(locateAndHighlight, 300);
            return () => {
                clearTimeout(timer);
                if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
            };
        } else {
            setHighlightElement(null);
        }
    }, [stepIndex, pathname, router]);

    const nextStep = () => {
        if (stepIndex < TOUR_STEPS.length - 1) {
            setStepIndex(prev => prev + 1);
        } else {
            endTour();
        }
    };

    const prevStep = () => {
        if (stepIndex > 0) {
            setStepIndex(prev => prev - 1);
        }
    };

    const endTour = () => {
        localStorage.removeItem('pg_tour_active');
        setHighlightElement(null); // Explicitly clear highlight
        setStepIndex(-1);
    };

    const isMarketingPage = ['/', '/features', '/governance', '/pricing', '/team', '/login', '/signup'].includes(pathname);
    if (stepIndex === -1 || isMarketingPage) return null;

    const currentStep = TOUR_STEPS[stepIndex];
    const Icon = currentStep.icon;

    return (
        <AnimatePresence mode="wait">
            {/* Spotlight Overlay */}
            {highlightElement && (
                <motion.div
                    key={`overlay-${currentStep.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[90] pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.3) 100%)'
                    }}
                />
            )}

            {/* Highlighting Pulse Box */}
            {highlightElement && (
                <HighlightBox key={`box-${currentStep.id}`} target={highlightElement} color={currentStep.color} />
            )}

            <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`fixed z-[100] ${isHovered ? 'opacity-20' : 'opacity-100'} transition-opacity duration-300`}
                style={{
                    bottom: '2rem',
                    left: '2rem',
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="absolute inset-0 pointer-events-none z-[9999]" style={{ overflow: 'hidden' }}>
                    <AnimatePresence>
                        {highlightElement && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute border-4 border-cyan-500 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.5)] z-[9999]"
                                style={{
                                    top: highlightElement.getBoundingClientRect().top + window.scrollY - 8,
                                    left: highlightElement.getBoundingClientRect().left + window.scrollX - 8,
                                    width: highlightElement.getBoundingClientRect().width + 16,
                                    height: highlightElement.getBoundingClientRect().height + 16,
                                }}
                            >
                                <motion.div
                                    className="absolute -top-3 -right-3 bg-cyan-500 text-white rounded-full p-1 shadow-lg"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <Zap className="w-4 h-4" />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="bg-[#0b101a] border border-cyan-500/30 p-1 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] w-[380px] overflow-hidden">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono uppercase tracking-widest ${currentStep.color} font-black`}>
                                {currentStep.badge}
                            </span>
                            {isAutoPilot && (
                                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[8px] animate-pulse">Auto-Pilot Active</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsAutoPilot(!isAutoPilot)}
                                className={`h-6 w-6 ${isAutoPilot ? 'text-cyan-400' : 'text-gray-500'}`}
                                title={isAutoPilot ? "Pause Auto-Pilot" : "Resume Auto-Pilot"}
                            >
                                <Zap className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={endTour} className="h-6 w-6 hover:text-white text-gray-500">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="p-6 relative">
                        {/* Content */}
                        <div className="flex items-start gap-4 mb-5">
                            <div className={`p-2.5 rounded-xl ${currentStep.bg} ${currentStep.color} shrink-0 shadow-lg`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg mb-1">{currentStep.title}</h3>
                                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                                    {currentStep.desc}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={prevStep}
                                disabled={stepIndex === 0}
                                className="text-gray-500 hover:text-white text-xs px-0"
                            >
                                <ArrowLeft className="w-3 h-3 mr-1" /> Back
                            </Button>

                            <div className="flex gap-2">
                                {currentStep.interactiveAction && (
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            const target = document.querySelector(currentStep.interactiveAction!.target) as HTMLElement;
                                            if (target) {
                                                target.click();
                                                setIsAutoPilot(false); // Pause so they can see result
                                            }
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-5 rounded-full font-bold shadow-lg shadow-emerald-500/20"
                                    >
                                        <Zap className="w-3 h-3 mr-2" /> {currentStep.interactiveAction.label}
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={nextStep}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-8 px-5 rounded-full font-bold shadow-lg shadow-cyan-500/20"
                                >
                                    {currentStep.actionBtn || "Next"} <ArrowRight className="w-3 h-3 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1 bg-gray-900 w-full mt-0">
                        <motion.div
                            className="h-full bg-cyan-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${((stepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
                        />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Sub-component for the highlight box
function HighlightBox({ target, color }: { target: HTMLElement, color: string }) {
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

    useEffect(() => {
        const updateCoords = () => {
            const box = target.getBoundingClientRect();
            setCoords({
                top: box.top + window.scrollY,
                left: box.left + window.scrollX,
                width: box.width,
                height: box.height
            });
        };

        const timer = setTimeout(updateCoords, 100); // Slight delay for scroll to finish
        window.addEventListener('resize', updateCoords);
        window.addEventListener('scroll', updateCoords);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords);
        };
    }, [target]);

    const borderClass = color.includes('cyan') ? 'border-cyan-500' :
        color.includes('green') ? 'border-green-500' :
            color.includes('red') ? 'border-red-500' :
                color.includes('purple') ? 'border-purple-500' :
                    color.includes('orange') ? 'border-orange-500' : 'border-blue-500';

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[95]">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`absolute rounded-xl border-2 ${borderClass} shadow-[0_0_30px_rgba(6,182,212,0.3)] bg-transparent`}
                style={{
                    top: coords.top - 12,
                    left: coords.left - 12,
                    width: coords.width + 24,
                    height: coords.height + 24,
                    transition: 'all 0.3s ease-out'
                }}
            >
                {/* Holographic Corners */}
                <div className={`absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 ${borderClass} rounded-tl-lg`} />
                <div className={`absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 ${borderClass} rounded-tr-lg`} />
                <div className={`absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 ${borderClass} rounded-bl-lg`} />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 ${borderClass} rounded-br-lg`} />

                {/* Scanning Light Effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent w-full h-[20%]"
                    animate={{
                        top: ['0%', '100%', '0%'],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            </motion.div>
        </div>
    );
}
