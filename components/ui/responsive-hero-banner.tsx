"use client";

import React, { useState } from 'react';
import { useLanguage } from '@/app/language-provider';
import { languageOptions } from '@/lib/languages';
import RotatingLogo from '@/app/rotating-logo';

export interface NavLink {
    label: string;
    href: string;
    isActive?: boolean;
}

export interface Partner {
    logoUrl: string;
    href: string;
}

export interface FeatureItem {
    title: string;
    description: string;
    badge?: string;
    href?: string;
}

export interface ResponsiveHeroBannerProps {
    logoUrl?: string;
    backgroundImageUrl?: string;
    navLinks?: NavLink[];
    ctaButtonText?: string;
    ctaButtonHref?: string;
    badgeText?: string;
    badgeLabel?: string;
    title?: string;
    titleLine2?: string;
    description?: string;
    primaryButtonText?: string;
    primaryButtonHref?: string;
    secondaryButtonText?: string;
    secondaryButtonHref?: string;
    partnersTitle?: string;
    partners?: Partner[];
    featuresTitle?: string;
    features?: FeatureItem[];
}

const ResponsiveHeroBanner: React.FC<ResponsiveHeroBannerProps> = ({
    logoUrl = "/assets-mirror/logo.png",
    backgroundImageUrl = "/clean-hero-bg.jpg",
    navLinks = [
        { label: "Home", href: "/", isActive: true },
        { label: "Plugins", href: "/plugins" },
        { label: "DAW", href: "/plugins#studio" },
        { label: "How to use", href: "/tutorials" },
        { label: "Downloads", href: "/downloads" }
    ],
    ctaButtonText = "My account",
    ctaButtonHref = "/account",
    badgeLabel = "New",
    badgeText = "MLAM Voice MIDI VST3 — Transform Voice to MIDI",
    title = "Create · Produce · Own",
    titleLine2 = "Your Studio Sound",
    description = "Experience your sound like never before. Turn your voice, melodies, and musical ideas into pure MIDI and professional records with MLAM instruments, VST3 plugins, and creative DAW tools.",
    primaryButtonText = "Explore Plugins",
    primaryButtonHref = "/plugins",
    secondaryButtonText = "Watch Guides",
    secondaryButtonHref = "/tutorials",
    partnersTitle = "Trusted by producers and creators worldwide",
    partners = [
        { logoUrl: "/assets-mirror/partner1.png", href: "/plugins" },
        { logoUrl: "/assets-mirror/partner2.png", href: "/plugins" },
        { logoUrl: "/assets-mirror/partner3.png", href: "/plugins" },
        { logoUrl: "/assets-mirror/partner4.png", href: "/plugins" },
        { logoUrl: "/assets-mirror/partner5.png", href: "/plugins" }
    ],
    featuresTitle = "Core Studio Platform & Audio Engine",
    features = [
        { title: "VST3", description: "Instruments & effects", badge: "Pro Audio", href: "#plugins" },
        { title: "MIDI", description: "Creative tools & capture", badge: "Engine", href: "#plugins" },
        { title: "MLAM", description: "Original studio design", badge: "Original", href: "#plugins" },
        { title: "DAW", description: "Complete workspace coming soon", badge: "Coming soon", href: "#studio" }
    ]
}) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { language, setLanguage } = useLanguage();

    return (
        <section className="w-full isolate min-h-screen overflow-hidden relative bg-[#030805]">
            {/* Deep Studio Emerald + Obsidian Black Atmospheric Background */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10">
                {/* Base Deep Emerald Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#07190e] via-[#030b06] to-[#020704]" />
                
                {/* Atmospheric Emerald Light Orbs (blended smoothly with black) */}
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[950px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(16,48,26,0.6)_0%,rgba(6,22,12,0.25)_45%,transparent_70%)] blur-2xl" />
                <div className="absolute top-1/4 right-[5%] w-[650px] h-[650px] bg-[radial-gradient(circle_at_center,rgba(15,48,26,0.65)_0%,rgba(5,18,10,0.2)_50%,transparent_70%)] blur-3xl" />
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#020704] to-transparent" />
                
                {/* Subtle Studio Acoustic Micro-Grid Texture */}
                <div 
                    className="absolute inset-0 opacity-[0.14] mix-blend-screen"
                    style={{
                        backgroundImage: `radial-gradient(rgba(74, 222, 128, 0.25) 1px, transparent 1px)`,
                        backgroundSize: '32px 32px'
                    }}
                />
            </div>
            <div className="pointer-events-none absolute inset-0 ring-1 ring-white/[0.05]" />

            <header className="z-20 xl:top-4 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between pt-4">
                        {/* Brand Logo */}
                        <a
                            href="/"
                            className="inline-flex items-center justify-center bg-center w-[100px] h-[40px] bg-contain bg-no-repeat rounded transition-opacity hover:opacity-90"
                            style={{ backgroundImage: `url(${logoUrl})` }}
                            aria-label="MLAM Studio Home"
                        />

                        {/* Desktop Navigation Capsule */}
                        <nav className="hidden md:flex items-center gap-2">
                            <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1.5 ring-1 ring-white/15 backdrop-blur-md shadow-2xl">
                                {navLinks.map((link, index) => (
                                    <a
                                        key={index}
                                        href={link.href}
                                        className={`px-3.5 py-1.5 text-sm font-medium font-sans rounded-full transition-all ${
                                            link.isActive
                                                ? 'bg-white/20 text-white font-semibold shadow-sm'
                                                : 'text-white/80 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        {link.label}
                                    </a>
                                ))}

                                {/* High-contrast Account CTA Button with solid black text */}
                                <a
                                    href={ctaButtonHref}
                                    style={{ color: '#09090b', backgroundColor: '#ffffff' }}
                                    className="ml-2 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold shadow-lg hover:bg-neutral-100 hover:scale-105 transition-all font-sans cursor-pointer select-none"
                                >
                                    <span style={{ color: '#09090b' }} className="font-bold text-[#09090b]">
                                        {ctaButtonText}
                                    </span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#09090b"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-3.5 w-3.5"
                                    >
                                        <path d="M7 7h10v10" />
                                        <path d="M7 17 17 7" />
                                    </svg>
                                </a>
                            </div>
                        </nav>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center gap-2">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur text-white"
                                aria-expanded={mobileMenuOpen}
                                aria-label="Toggle menu"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
                                    <path d="M4 5h16" />
                                    <path d="M4 12h16" />
                                    <path d="M4 19h16" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Dropdown Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden mt-3 rounded-2xl bg-neutral-900/95 ring-1 ring-white/15 p-4 backdrop-blur-xl space-y-2">
                            {navLinks.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block px-4 py-2.5 rounded-lg text-base font-medium ${
                                        link.isActive ? 'bg-white/15 text-white font-semibold' : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {link.label}
                                </a>
                            ))}
                            <a
                                href={ctaButtonHref}
                                onClick={() => setMobileMenuOpen(false)}
                                style={{ color: '#09090b', backgroundColor: '#ffffff' }}
                                className="block text-center mt-3 w-full rounded-full px-4 py-2.5 text-sm font-bold shadow-md hover:bg-neutral-100"
                            >
                                <span style={{ color: '#09090b' }}>{ctaButtonText} ↗</span>
                            </a>
                        </div>
                    )}
                </div>
            </header>

            {/* Hero Main Content */}
            <div className="z-10 relative">
                <div className="max-w-7xl mx-auto pt-16 sm:pt-20 md:pt-24 px-6 pb-12">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
                        {/* Text Content (Left) */}
                        <div className="md:col-span-7 text-center md:text-left">
                            {/* Badge Capsule */}
                            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/10 px-2.5 py-2 ring-1 ring-white/15 backdrop-blur animate-fade-slide-in-1">
                                <span className="inline-flex items-center text-xs font-semibold text-neutral-950 bg-white rounded-full py-0.5 px-2.5 font-sans">
                                    {badgeLabel}
                                </span>
                                <span className="text-sm font-medium text-white/90 font-sans tracking-wide">
                                    {badgeText}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-4xl text-white tracking-tight font-instrument-serif font-normal animate-fade-slide-in-2">
                                {title}
                                <br className="hidden sm:block" />
                                {titleLine2}
                            </h1>

                            {/* Description */}
                            <p className="sm:text-lg animate-fade-slide-in-3 text-base text-white/80 max-w-2xl mt-6 mx-auto md:mx-0 font-sans leading-relaxed">
                                {description}
                            </p>

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row sm:gap-4 mt-10 gap-3 items-center justify-center md:justify-start animate-fade-slide-in-4">
                                <a
                                    href={primaryButtonHref}
                                    className="inline-flex items-center gap-2 hover:bg-white/15 text-sm font-medium text-white bg-white/10 ring-white/15 ring-1 rounded-full py-3 px-6 font-sans transition-all hover:scale-105 shadow-md"
                                >
                                    {primaryButtonText}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                        <path d="M5 12h14" />
                                        <path d="m12 5 7 7-7 7" />
                                    </svg>
                                </a>
                                <a
                                    href={secondaryButtonHref}
                                    className="inline-flex items-center gap-2 rounded-full bg-transparent px-6 py-3 text-sm font-medium text-white/90 hover:text-white font-sans transition-colors hover:bg-white/5"
                                >
                                    {secondaryButtonText}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <polygon points="6 3 20 12 6 21 6 3" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* 3D Rotating Logo (Right) */}
                        <div className="md:col-span-5 flex flex-col items-center justify-center relative animate-fade-slide-in-3">
                            <div className="relative w-full max-w-[360px] sm:max-w-[420px] flex flex-col items-center justify-center">
                                {/* Ambient Studio Glow Aura */}
                                <div className="absolute w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] bg-gradient-to-tr from-emerald-500/30 via-green-500/20 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
                                <div className="w-full flex items-center justify-center py-2">
                                    <RotatingLogo />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Core Audio Engine & Features Grid */}
                    <div className="mx-auto mt-16 max-w-6xl">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <span className="logo-metallic-divider w-12 sm:w-24" />
                            <p className="logo-metallic-kicker animate-fade-slide-in-1">
                                {featuresTitle}
                            </p>
                            <span className="logo-metallic-divider w-12 sm:w-24" />
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-slide-in-2">
                            {features.map((feat, index) => (
                                <a
                                    key={index}
                                    href={feat.href || "#plugins"}
                                    className="logo-metallic-card group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <strong className="logo-metallic-text">
                                            {feat.title}
                                        </strong>
                                        {feat.badge && (
                                            <span className="logo-metallic-badge">
                                                {feat.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="logo-metallic-desc">
                                        {feat.description}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResponsiveHeroBanner;
