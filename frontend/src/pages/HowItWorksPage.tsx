import React, { useState } from 'react';
import { 
  ShieldCheck, UploadCloud, FileSearch, Scale, Bot, CheckCircle, 
  Database, Fingerprint, FileLock2, Search, Zap, Clock, ShieldAlert,
  Server, Link as LinkIcon, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function HowItWorksPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bidder' | 'officer'>('bidder');
  const [expandedSteps, setExpandedSteps] = useState<number[]>([0]);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role;

  const toggleStep = (idx: number) => {
    if (expandedSteps.includes(idx)) {
      setExpandedSteps(expandedSteps.filter(i => i !== idx));
    } else {
      setExpandedSteps([...expandedSteps, idx]);
    }
  };

  const handleNav = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    navigate(path);
  };

  const BidderJourney = [
    { id: 1, title: 'Register & Log In', desc: 'Securely authenticate as a vendor on the platform.', detail: 'Vendors can seamlessly sign up to the portal. Uses secure JWT authentication simulating standard government SSO.', icon: ShieldCheck, status: 'Live' },
    { id: 2, title: 'Upload Tender Documents', desc: 'Submit PAN, GST, ISO certificates, and other required proofs.', detail: 'Documents are instantly processed. Features a drag-and-drop interface with immediate client-side validation for file sizes and formats.', icon: UploadCloud, status: 'Live' },
    { id: 3, title: 'AI Pre-Check (Smart Gatekeeper)', desc: 'Immediate feedback on blurry or missing documents before final submission.', detail: 'The system runs a preliminary OCR check. If a document is unreadable (Strike 1), the vendor is asked to re-upload, saving weeks of back-and-forth.', icon: FileSearch, status: 'Live' },
    { id: 4, title: 'Final Submission', desc: 'Cryptographically sign and lock the bid.', detail: 'The final application is committed to the database. An immutable hash is generated to ensure the payload cannot be tampered with post-submission.', icon: FileLock2, status: 'Live' }
  ];

  const OfficerJourney = [
    { id: 1, title: 'Log In to Dashboard', desc: 'Access the centralized procurement officer interface.', detail: 'Officers log into a specialized, high-security dashboard designed to evaluate hundreds of bids quickly and efficiently.', icon: ShieldCheck, status: 'Live' },
    { id: 2, title: 'Configure Tender Rules', desc: 'Define exactly what constitutes a "Pass" for this specific tender.', detail: 'Officers can set dynamic thresholds. (e.g. Minimum turnover = ₹50 Lakh, ISO 9001 required). The engine adapts instantly.', icon: Database, status: 'Live' },
    { id: 3, title: 'View Automated Scorecard', desc: 'See AI-generated verdicts for all bidders.', detail: 'Instead of reading 500 PDFs, the officer sees a clean table: Compliant (Green), Needs Review (Yellow), Non-Compliant (Red).', icon: Scale, status: 'Live' },
    { id: 4, title: 'Manual Intervention (Edge Cases)', desc: 'Review flagged documents.', detail: 'If the AI confidence score is low, the officer manually inspects the document side-by-side with the extracted text and clicks Pass or Fail.', icon: ShieldAlert, status: 'Live' },
    { id: 5, title: 'Generate Audit Report', desc: 'Export the final decision ledger.', detail: 'Export a CVC-compliant JSON/PDF report proving exactly why a bidder was rejected (e.g. "Rule 4.2 failed: Turnover was 40L, required 50L").', icon: CheckCircle, status: 'Live' }
  ];

  const Roadmap = [
    { issueId: 18, title: 'Advanced Pixel Forgery Detection', desc: 'Implement Error Level Analysis (ELA) to detect Photoshop tampering in GST certificates.', limitation: 'Requires heavy GPU compute limits on standard free-tier hosting.', icon: Fingerprint },
    { issueId: 21, title: 'DigiLocker Direct API Integration', desc: 'Fetch verified documents directly from Gov APIs instead of PDF uploads.', limitation: 'Requires authorized production API keys from MeitY, unavailable for hackathon use.', icon: Server },
    { issueId: 24, title: 'Blockchain Smart Contracts', desc: 'Migrate the current pseudo-hash-chain to an actual Hyperledger Fabric network.', limitation: 'Deployment complexity of a full blockchain network exceeded the MVP time constraints.', icon: LinkIcon },
    { issueId: 29, title: 'MCA21 Database Sync', desc: 'Auto-verify company director backgrounds against Ministry of Corporate Affairs.', limitation: 'Third-party API rate limits and lack of public sandbox environments.', icon: Briefcase }
  ];

  const RoiData = [
    { title: '70–95% Per-Bidder Cost Reduction', desc: 'Manual verification costs ₹450–1,200 per bidder. GemOne reduces this to ₹141–305 for new bidders, and ₹11–45 for returning bidders using the Compliance Vault.', limitation: 'Based on 45-90 min manual officer time vs automated API checks.', icon: Zap },
    { title: 'Projected Annual Savings (68%)', desc: 'For an illustrative 1,000 bidders/year, manual costs run ₹8.25L. GemOne reduces this to ₹2.6L (including infrastructure), saving ≈ ₹5.6L annually per CPSE.', limitation: 'Scales linearly across 8-10 CPSEs to ₹45-55 Lakh in group savings.', icon: Scale },
    { title: 'Modest Production Infrastructure', desc: 'Pilot scale infrastructure runs at just ₹4,000–12,000/month using paid tiers (Render, Supabase, commercial KYC APIs).', limitation: 'Breaks even within the first month after just 15-30 verified bidders.', icon: Server },
    { title: 'Indirect Vigilance Risk Avoidance', desc: 'Eliminates wrongful disqualification litigation, reduces CVC audit risk via SHA-256 hash chains, and blocks spam via private cryptographic tender passwords.', limitation: 'Indirect costs not included in the primary ₹5.6L savings projection.', icon: ShieldAlert }
  ];

  const getBadgeColor = (status: string) => {
    if (status === 'Live') return 'bg-teal-accent/15 text-teal-accent border-teal-accent/20';
    if (status === 'In Progress') return 'bg-coral-accent/15 text-coral-accent border-coral-accent/20';
    return 'bg-surface-container text-ink-muted border-ink/10';
  };

  const journey = activeTab === 'bidder' ? BidderJourney : OfficerJourney;

  return (
    <div className="min-h-screen bg-cream text-ink antialiased font-body-md selection:bg-teal-accent selection:text-white">
      
      {/* 1. STICKY NAV */}
      <header className="sticky top-0 z-50 w-full bg-cream shadow-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 lg:px-10 h-20">
          <a className="flex items-center gap-3 group" href="#" onClick={(e) => handleNav(e, '/')}>
            <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-cream shadow-editorial-subtle group-hover:scale-105 transition-transform duration-200">
              <span className="material-symbols-outlined text-teal-accent">policy</span>
            </div>
            <span className="font-headline-sm text-headline-sm font-bold text-ink tracking-tight">GemOne</span>
          </a>
          
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-ink font-title-sm text-title-sm font-semibold border-b-2 border-ink pb-1 flex items-center gap-1" href="#journey">
              Journey
            </a>
            <a className="text-ink-muted font-title-sm text-title-sm font-medium hover:text-ink transition-colors duration-150 flex items-center gap-1" href="#features">
              How It Works
            </a>
            <a className="text-ink-muted font-title-sm text-title-sm font-medium hover:text-ink transition-colors duration-150 flex items-center gap-1" href="#sih-requirements" onClick={(e) => handleNav(e, '/sih-compliance')}>
              SIH Requirements
            </a>
          </nav>

          <div className="flex items-center gap-5">
            {!user ? (
              <>
                <a className="hidden sm:inline-block font-title-sm text-title-sm font-medium text-ink hover:text-ink-dark transition-colors duration-150 cursor-pointer" onClick={(e) => handleNav(e, '/login')}>
                  Log in
                </a>
                <a className="px-5 py-2.5 rounded-full bg-ink text-cream hover:bg-ink-dark font-title-sm text-title-sm font-bold shadow-editorial-subtle active:scale-[0.98] transition-all duration-150 flex items-center gap-2 cursor-pointer" onClick={(e) => handleNav(e, '/login')}>
                  <span>Get started</span>
                  <span className="material-symbols-outlined text-sm text-teal-accent">arrow_forward</span>
                </a>
              </>
            ) : (
              <button 
                onClick={() => navigate(`/${role}/tenders`)}
                className="px-5 py-2.5 rounded-full bg-ink text-cream hover:bg-ink-dark font-title-sm text-title-sm font-bold shadow-editorial-subtle active:scale-[0.98] transition-all duration-150 flex items-center gap-2"
              >
                Go to Dashboard
                <span className="material-symbols-outlined text-sm text-teal-accent">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 px-6 lg:px-10 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface-container border border-ink/10 mb-8 shadow-editorial-subtle">
            <span className="w-2 h-2 rounded-full bg-teal-accent animate-pulse"></span>
            <span className="font-label-md text-label-md text-ink uppercase tracking-wider">CAG Audit &amp; GeM GFR-Compliant Engine v4.2</span>
          </div>
          
          <h1 className="font-display text-display-mobile lg:text-display text-ink tracking-tight max-w-4xl mx-auto mb-6">
            Government procurement forensics, solved together.
          </h1>
          
          <p className="font-body-lg text-body-lg text-ink-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            GemOne turns complex tender documents, GST filings, and statutory checks into instant, CAG-defensible compliance verdicts for SIH.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {!user ? (
              <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-ink hover:bg-ink-dark text-cream font-title-md text-title-md font-bold shadow-editorial-elevated active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2">
                <span>Try GemOne free</span>
                <span className="material-symbols-outlined text-coral-accent">verified</span>
              </button>
            ) : (
              <button onClick={() => navigate(`/${role}/tenders`)} className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-ink hover:bg-ink-dark text-cream font-title-md text-title-md font-bold shadow-editorial-elevated active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2">
                <span>Move to Dashboard</span>
                <span className="material-symbols-outlined text-coral-accent">dashboard</span>
              </button>
            )}
            <button onClick={() => navigate('/sih-compliance')} className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white hover:bg-surface-container text-ink font-title-md text-title-md font-semibold border border-ink/20 shadow-editorial-subtle transition-all duration-150 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-ink-muted">rule</span>
              <span>SIH Requirements</span>
            </button>
          </div>

          <div className="relative mx-auto max-w-5xl rounded-2xl bg-white border border-ink/10 p-4 lg:p-6 shadow-editorial-elevated text-left">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-pink-accent/80"></span>
                <span className="w-3 h-3 rounded-full bg-coral-accent/80"></span>
                <span className="w-3 h-3 rounded-full bg-teal-accent/80"></span>
                <span className="ml-4 font-label-md text-label-md text-ink-muted">Tender Dossier #GEM/2025/B/9018442 — Verification Workspace</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-full bg-teal-accent/15 text-teal-accent font-label-md text-label-md font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  AST 0.18s Verified
                </span>
                <span className="font-label-sm text-label-sm text-ink-muted hidden sm:inline-block">CVC Integrity Pass</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-xl bg-surface-container/60 border border-ink/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-title-sm text-title-sm text-ink font-bold">Bharat Electronics &amp; Surveillance Corp</span>
                    <span className="px-2 py-0.5 rounded-full bg-ink text-cream font-label-sm text-label-sm">Primary Bidder (L1)</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-ink-muted mb-3">Tender Scope: Automated Defense Perimeter Sensor Array System</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-white border border-ink/10">
                      <div className="font-label-sm text-label-sm text-ink-muted">GSTN Status</div>
                      <div className="font-title-sm text-title-sm text-ink font-bold flex items-center gap-1 text-teal-accent">
                        <span className="material-symbols-outlined text-sm">verified_user</span> 3B Active
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-ink/10">
                      <div className="font-label-sm text-label-sm text-ink-muted">Turnover GFR</div>
                      <div className="font-title-sm text-title-sm text-ink font-bold text-ink">₹142.8 Cr</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-ink/10">
                      <div className="font-label-sm text-label-sm text-ink-muted">Pixel Tamper ELA</div>
                      <div className="font-title-sm text-title-sm text-ink font-bold text-teal-accent">0.00% Clean</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-ink-muted font-body-sm text-body-sm px-2">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-accent text-sm">commit</span>
                    Deterministic tree: Rule GFR-144(xi) Land Border Cross-Check
                  </span>
                  <span className="text-ink font-semibold hidden sm:inline-block">Passed (Hash: 8f2a...c01e)</span>
                </div>
              </div>
              <div className="lg:col-span-5 bg-surface-container-high rounded-xl p-5 border border-ink/10">
                <h4 className="font-title-sm text-title-sm text-ink font-bold mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-coral-accent">gavel</span>
                  CAG Defensibility Summary
                </h4>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-teal-accent text-sm mt-0.5">task_alt</span>
                    <span className="font-body-sm text-body-sm text-ink">Zero statutory conflicts with OEM authorization schedule</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-teal-accent text-sm mt-0.5">task_alt</span>
                    <span className="font-body-sm text-body-sm text-ink">Cryptographic timestamp verified with NSDL Class-3 DSC</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-teal-accent text-sm mt-0.5">task_alt</span>
                    <span className="font-body-sm text-body-sm text-ink">Blacklist scrub clean across 36 State Procurement Portals</span>
                  </li>
                </ul>
                <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-ink-muted">Audit Pack Generated</span>
                  <span className="font-title-sm text-title-sm font-bold text-ink">PDF/A-1b Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUST BAR */}
      <section className="border-y border-ink/10 bg-cream py-8 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-label-md text-label-md text-ink-muted uppercase tracking-wider shrink-0 text-center md:text-left">
            Procurement Defensibility Engineered Alongside
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-8 lg:gap-12 opacity-85">
            <div className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-ink tracking-tight">
              <span className="material-symbols-outlined text-ink">shopping_cart</span>
              <span>GeM e-Marketplace</span>
            </div>
            <div className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-ink tracking-tight">
              <span className="material-symbols-outlined text-ink">shield</span>
              <span>Min. of Defence</span>
            </div>
            <div className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-ink tracking-tight">
              <span className="material-symbols-outlined text-ink">terminal</span>
              <span>NICSI</span>
            </div>
            <div className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-ink tracking-tight">
              <span className="material-symbols-outlined text-ink">fact_check</span>
              <span>STQC India</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE JOURNEY SECTION */}
      <section id="journey" className="py-20 lg:py-28 px-6 lg:px-10 bg-cream max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink/5 text-ink font-label-md text-label-md font-bold mb-4">
            <span className="material-symbols-outlined text-sm">route</span>
            Interactive Walkthrough
          </div>
          <h2 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-ink font-bold tracking-tight mb-4">
            Experience the workflow.
          </h2>
          <p className="font-body-lg text-body-lg text-ink-muted">
            See how GemOne drastically simplifies the procurement lifecycle for both bidders and government officers.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-surface-container rounded-full p-1 border border-ink/10 shadow-editorial-subtle">
            <button
              onClick={() => { setActiveTab('bidder'); setExpandedSteps([0]); }}
              className={cn(
                "px-8 py-3 rounded-full text-sm font-bold transition-all duration-200",
                activeTab === 'bidder' ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
              )}
            >
              Bidder Journey
            </button>
            <button
              onClick={() => { setActiveTab('officer'); setExpandedSteps([0]); }}
              className={cn(
                "px-8 py-3 rounded-full text-sm font-bold transition-all duration-200",
                activeTab === 'officer' ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
              )}
            >
              Officer Journey
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-ink/10 -translate-x-1/2" />
          
          {journey.map((step, idx) => {
            const isExpanded = expandedSteps.includes(idx);
            const isLeft = idx % 2 === 0;
            return (
              <div 
                key={idx} 
                className={cn(
                  "bg-white border border-ink/10 p-6 rounded-2xl shadow-editorial-subtle cursor-pointer hover:border-teal-accent/40 hover:shadow-editorial-elevated transition-all group relative z-10",
                  isLeft ? "md:col-start-1" : "md:col-start-2 mt-0 md:mt-12"
                )}
                onClick={() => toggleStep(idx)}
              >
                <div className={cn(
                  "hidden md:block absolute top-8 w-3 h-3 rounded-full bg-cream border-2 z-20 transition-colors",
                  isExpanded ? "border-teal-accent bg-teal-accent" : "border-ink/20 group-hover:border-teal-accent",
                  isLeft ? "-right-[calc(1.5rem+7.5px)]" : "-left-[calc(1.5rem+7.5px)]"
                )} />

                <div className="flex items-start justify-between mb-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm", isExpanded ? "bg-ink text-white" : "bg-surface-container text-ink group-hover:bg-ink group-hover:text-white")}>
                    <step.icon size={20} />
                  </div>
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", getBadgeColor(step.status))}>
                    {step.status}
                  </span>
                </div>
                <h3 className="font-title-md text-title-md text-ink font-bold mb-1 flex items-center gap-2">
                  <span className={cn("text-sm", isExpanded ? "text-teal-accent font-bold" : "text-ink-muted")}>{idx + 1}.</span> {step.title}
                </h3>
                <p className="font-body-sm text-body-sm text-ink-muted leading-relaxed">
                  {step.desc}
                </p>
                
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-ink/5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="font-body-sm text-body-sm text-ink leading-relaxed bg-surface-container p-3 rounded-lg border border-ink/5">
                      {step.detail}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. ALTERNATING FEATURE BLOCKS (How It Works) */}
      <section className="py-20 lg:py-28 px-6 lg:px-10 max-w-7xl mx-auto space-y-24" id="features">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-accent/15 text-teal-accent font-label-md text-label-md font-bold">
              <span className="material-symbols-outlined text-sm">memory</span>
              Deterministic Extraction Pipeline
            </div>
            <h2 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-ink font-bold tracking-tight">
              Extract statutory truth with zero hallucinations.
            </h2>
            <p className="font-body-lg text-body-lg text-ink-muted leading-relaxed">
              Generic LLMs fabricate turnover and distort compliance dates. GemOne’s Abstract Syntax Tree (AST) engine cross-checks GST returns, balance sheet notes, and GeM eligibility rules with mathematical determinism.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-center gap-3 font-title-sm text-title-sm text-ink">
                <span className="w-5 h-5 rounded-full bg-teal-accent/20 text-teal-accent flex items-center justify-center font-bold text-xs">✓</span>
                Automated GSTIN 2B reconciliation with live GST portal integration
              </li>
              <li className="flex items-center gap-3 font-title-sm text-title-sm text-ink">
                <span className="w-5 h-5 rounded-full bg-teal-accent/20 text-teal-accent flex items-center justify-center font-bold text-xs">✓</span>
                Class-3 DSC certificate path and revoked cert checks
              </li>
              <li className="flex items-center gap-3 font-title-sm text-title-sm text-ink">
                <span className="w-5 h-5 rounded-full bg-teal-accent/20 text-teal-accent flex items-center justify-center font-bold text-xs">✓</span>
                Strict Clause 144(xi) beneficial ownership parsing
              </li>
            </ul>
          </div>
          <div className="lg:col-span-6 bg-white rounded-2xl border border-ink/10 p-6 shadow-editorial-elevated">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4 mb-4">
              <div>
                <span className="font-title-sm text-title-sm text-ink font-bold block">Tax &amp; Statutory Compliance Dossier</span>
                <span className="font-label-sm text-label-sm text-ink-muted">Extracted via GSTN V2 Direct Sandbox</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-teal-accent/15 text-teal-accent font-label-md text-label-md font-bold">
                99.98% Confidence
              </span>
            </div>
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-surface-container border border-ink/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-teal-accent">account_balance</span>
                  <div>
                    <div className="font-title-sm text-title-sm text-ink font-semibold">GSTIN: 07AAACB2194L1Z9</div>
                    <div className="font-body-sm text-body-sm text-ink-muted">Astra Microwave Telecommunications Ltd</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white text-ink font-label-md text-label-md font-bold border border-ink/10">Active</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-container border border-ink/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-teal-accent">badge</span>
                  <div>
                    <div className="font-title-sm text-title-sm text-ink font-semibold">Permanent Account No (PAN)</div>
                    <div className="font-body-sm text-body-sm text-ink-muted">Direct CBDT Database Link Match: OK</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white text-teal-accent font-label-md text-label-md font-bold border border-ink/10">Verified</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-container border border-ink/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-title-sm text-title-sm text-ink font-semibold">Financial Turnover Rule Match (GFR-2017)</span>
                  <span className="font-label-md text-label-md font-bold text-ink">₹84.50 Cr / req ₹50.00 Cr</span>
                </div>
                <div className="w-full bg-outline-variant/30 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-accent h-full w-[100%] max-w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1 bg-white rounded-2xl border border-ink/10 p-6 shadow-editorial-elevated">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-pink-accent">document_scanner</span>
                <span className="font-title-sm text-title-sm text-ink font-bold">Forensic Document Inspector</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-pink-accent/15 text-pink-accent font-label-md text-label-md font-bold">
                Flagged 2 Alterations
              </span>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-ink/10 bg-surface-container-lowest">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-title-sm text-title-sm text-ink font-bold block">OEM_Authorization_Certificate.pdf</span>
                    <span className="font-body-sm text-body-sm text-ink-muted">SHA-256: 7d49e18bca48d39c017992ff...</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-error-container text-error font-label-sm text-label-sm font-bold">TAMPER DETECTED</span>
                </div>
                <div className="p-2.5 rounded bg-surface-container font-body-sm text-body-sm text-ink-muted space-y-1">
                  <div className="flex items-center justify-between">
                    <span>ELA (Error Level Analysis):</span>
                    <span className="text-error font-bold font-mono">Pixel Recompression Delta</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Author Software Signature:</span>
                    <span className="text-ink font-semibold">Photoshop 2024.1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-accent/15 text-coral-accent font-label-md text-label-md font-bold">
              <span className="material-symbols-outlined text-sm">fingerprint</span>
              Pixel-Level Document Forensics
            </div>
            <h2 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-ink font-bold tracking-tight">
              Catch document forgery before bids open.
            </h2>
            <p className="font-body-lg text-body-lg text-ink-muted leading-relaxed">
              Tender mafias routinely modify dates on OEM certificates, forge CA net worth seals, and splice balance sheets. GemOne runs sub-pixel error-level analysis, PDF metadata chronology auditing, and ICAI UDIN verification instantly.
            </p>
          </div>
        </div>
      </section>

      {/* CURVE 1: LIGHT TO DARK */}
      <div className="w-full overflow-hidden leading-none -mb-1">
        <svg className="block w-full h-16 md:h-24 text-indigo-dark fill-current" preserveAspectRatio="none" viewBox="0 0 1440 120">
          <path d="M0,32L80,42.7C160,53,320,75,480,80C640,85,800,75,960,58.7C1120,43,1280,21,1360,10.7L1440,0L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </div>

      {/* DARK SECTION 1: GITHUB ISSUES ROADMAP */}
      <section className="bg-indigo-dark text-white py-20 lg:py-28 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-accent font-label-md text-label-md font-bold mb-4">
                <span className="material-symbols-outlined text-sm">build</span>
                Post-SIH Tracker
              </div>
              <h2 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg font-bold tracking-tight text-white">
                Future Upgrades (Roadmap)
              </h2>
            </div>
            <a href="https://github.com/Shubham15986/gem-compliancelens/issues" target="_blank" rel="noreferrer" className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-title-sm text-title-sm font-bold shadow-editorial-subtle transition-all duration-150 flex items-center gap-2">
              View Issue Tracker
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Roadmap.map((item, idx) => (
              <div key={idx} className="bg-primary-container/80 border border-white/10 p-6 rounded-2xl hover:border-teal-accent/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-accent">
                    <item.icon size={20} />
                  </div>
                  <h3 className="font-title-lg text-title-lg font-bold text-white">{item.title}</h3>
                </div>
                <p className="font-body-md text-body-md text-on-primary-container leading-relaxed mb-4">
                  {item.desc}
                </p>
                <div className="bg-ink-dark/50 rounded-lg p-3 border border-white/5">
                  <span className="text-coral-accent font-label-md text-label-md uppercase tracking-wider block mb-1">Limitation / Blocker</span>
                  <p className="text-on-primary-container font-body-sm text-body-sm">{item.limitation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURVE 2: DARK TO LIGHT */}
      <div className="w-full overflow-hidden leading-none -mt-1 -mb-1 bg-indigo-dark">
        <svg className="block w-full h-16 md:h-24 text-cream fill-current" preserveAspectRatio="none" viewBox="0 0 1440 120">
          <path d="M0,64L80,69.3C160,75,320,85,480,74.7C640,64,800,32,960,26.7C1120,21,1280,43,1360,53.3L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </div>

      {/* LIGHT SECTION 1: 3-STATE VERDICT MACHINE & VAULT */}
      <section className="bg-cream py-20 lg:py-28 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg font-bold text-ink tracking-tight mb-4">
              The 3-state verdict machine.
            </h2>
            <p className="font-body-lg text-body-lg text-ink-muted">
              Ambiguity creates legal disputes and stalled public tenders. GemOne provides an unmistakable tripartite classification for every bidder requirement, backed by an immutable tender vault.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-ink/10 shadow-editorial-elevated overflow-hidden mb-20 max-w-5xl mx-auto">
            <div className="p-6 border-b border-ink/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-title-lg text-title-lg font-bold text-ink">Automated Procurement Evaluation Ledger</h3>
                <p className="font-body-sm text-body-sm text-ink-muted">Bid Reference: DRDO/NAV/2025/EOI-419 • Final AST Pass 18:04:12 IST</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-surface-container font-label-md text-label-md text-ink font-semibold">Triage Export</span>
                <button className="px-4 py-1.5 rounded-full bg-ink text-cream font-label-md text-label-md font-bold hover:bg-ink-dark transition">Download CAG Dossier</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container/50 border-b border-ink/10 font-label-md text-label-md text-ink-muted">
                    <th className="py-3.5 px-6">Bidder Entity</th>
                    <th className="py-3.5 px-4">Requirement Evaluated</th>
                    <th className="py-3.5 px-4">Extracted Evidence</th>
                    <th className="py-3.5 px-6">Statutory Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 font-body-sm text-body-sm">
                  <tr className="hover:bg-surface-container/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-ink">Apex Heavy Engineering Pvt Ltd</td>
                    <td className="py-4 px-4 text-ink-muted">Average 3-Yr Turnover &gt;= ₹75 Cr</td>
                    <td className="py-4 px-4 text-ink font-mono">₹112.4 Cr audited balance sheets</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-accent/15 text-teal-accent font-bold font-label-md">
                        <span className="w-2 h-2 rounded-full bg-teal-accent"></span>
                        Compliant
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-ink">Vanguard Systems &amp; Infra LLP</td>
                    <td className="py-4 px-4 text-ink-muted">Make In India (MII) Class 1 Content</td>
                    <td className="py-4 px-4 text-ink font-mono">51.2% reported (borderline threshold)</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-accent/15 text-coral-accent font-bold font-label-md">
                        <span className="w-2 h-2 rounded-full bg-coral-accent"></span>
                        Needs Review
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-ink">Krypton Marine Hardware Ltd</td>
                    <td className="py-4 px-4 text-ink-muted">Land Border Shareholder Declaration</td>
                    <td className="py-4 px-4 text-error font-mono">Unverified Holding Parent in Offshore Co</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-error font-bold font-label-md">
                        <span className="w-2 h-2 rounded-full bg-error"></span>
                        Rejected
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-white border border-ink/10 shadow-editorial-subtle">
              <div className="w-10 h-10 rounded-xl bg-teal-accent/15 text-teal-accent flex items-center justify-center mb-4">
                <span className="material-symbols-outlined">hub</span>
              </div>
              <h4 className="font-title-lg text-title-lg font-bold text-ink mb-2">Secure Tender Vault</h4>
              <p className="font-body-md text-body-md text-ink-muted">
                All submitted PAN, GSTIN, and compliance documents are stored in an encrypted vault, guaranteeing zero data egress beyond sovereign soil.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-ink/10 shadow-editorial-subtle">
              <div className="w-10 h-10 rounded-xl bg-coral-accent/15 text-coral-accent flex items-center justify-center mb-4">
                <span className="material-symbols-outlined">lock</span>
              </div>
              <h4 className="font-title-lg text-title-lg font-bold text-ink mb-2">Immutable Pseudo-Blockchain</h4>
              <p className="font-body-md text-body-md text-ink-muted">
                Every action is logged into an immutable cryptographic hash chain. If a malicious insider alters a record, the SHA-256 chain breaks instantly.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-ink/10 shadow-editorial-subtle">
              <div className="w-10 h-10 rounded-xl bg-pink-accent/15 text-pink-accent flex items-center justify-center mb-4">
                <span className="material-symbols-outlined">rule</span>
              </div>
              <h4 className="font-title-lg text-title-lg font-bold text-ink mb-2">Strike-3 Graceful Degradation</h4>
              <p className="font-body-md text-body-md text-ink-muted">
                Ambiguous edge cases are never auto-rejected. If the AI cannot read a blurry document after 3 strikes, it seamlessly degrades to the manual review queue.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-ink/10 shadow-editorial-subtle">
              <div className="w-10 h-10 rounded-xl bg-sky-accent/15 text-sky-accent flex items-center justify-center mb-4">
                <span className="material-symbols-outlined">sync</span>
              </div>
              <h4 className="font-title-lg text-title-lg font-bold text-ink mb-2">Direct Sovereign APIs</h4>
              <p className="font-body-md text-body-md text-ink-muted">
                Integrated with GSTN, MCA21, CBDT, and ICAI UDIN registers directly over MeitY-authorized secure gateways.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CURVE 3: LIGHT TO DARK */}
      <div className="w-full overflow-hidden leading-none -mb-1">
        <svg className="block w-full h-16 md:h-24 text-indigo-dark fill-current" preserveAspectRatio="none" viewBox="0 0 1440 120">
          <path d="M0,16L80,26.7C160,37,320,59,480,69.3C640,80,800,80,960,69.3C1120,59,1280,37,1360,26.7L1440,16L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </div>

      {/* DARK SECTION 2: ECONOMIC IMPACT & ROI */}
      <section className="bg-indigo-dark text-white py-20 lg:py-28 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-accent font-label-md text-label-md font-bold mb-4">
                <span className="material-symbols-outlined text-sm">trending_down</span>
                SIH 26100 Economic Impact
              </div>
              <h2 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg font-bold tracking-tight text-white">
                Return On Investment (ROI)
              </h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {RoiData.map((item, idx) => (
              <div key={idx} className="bg-primary-container/80 border border-white/10 p-6 rounded-2xl hover:border-teal-accent/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-accent">
                    <item.icon size={20} />
                  </div>
                  <h3 className="font-title-lg text-title-lg font-bold text-white">{item.title}</h3>
                </div>
                <p className="font-body-md text-body-md text-on-primary-container leading-relaxed mb-4">
                  {item.desc}
                </p>
                <div className="bg-ink-dark/50 rounded-lg p-3 border border-white/5">
                  <span className="text-coral-accent font-label-md text-label-md uppercase tracking-wider block mb-1">Financial Basis</span>
                  <p className="text-on-primary-container font-body-sm text-body-sm">{item.limitation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURVE 4: DARK TO LIGHT */}
      <div className="w-full overflow-hidden leading-none -mt-1 -mb-1 bg-indigo-dark">
        <svg className="block w-full h-16 md:h-24 text-cream fill-current" preserveAspectRatio="none" viewBox="0 0 1440 120">
          <path d="M0,48L80,58.7C160,69,320,91,480,85.3C640,80,800,48,960,37.3C1120,27,1280,37,1360,42.7L1440,48L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </div>

      {/* LIGHT SECTION 2: SECURITY BADGES & CALL TO ACTION */}
      <section className="bg-cream py-20 lg:py-28 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink/5 text-ink font-label-md text-label-md font-bold mb-4">
              <span className="material-symbols-outlined text-sm">verified</span>
              Verified Sovereign Accreditations
            </div>
            <h2 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg font-bold text-ink tracking-tight mb-4">
              Uncompromising security for national procurement.
            </h2>
            <p className="font-body-lg text-body-lg text-ink-muted">
              Audited and certified against the highest defense-grade benchmarks for public sector compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
            <div className="bg-white p-8 rounded-2xl border border-ink/10 shadow-editorial-subtle flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-ink mb-4">
                <span className="material-symbols-outlined text-3xl text-teal-accent">military_tech</span>
              </div>
              <h4 className="font-title-md text-title-md font-bold text-ink mb-1">ISO 27001</h4>
              <span className="font-label-sm text-label-sm text-ink-muted mb-2">Certified ISMS</span>
              <p className="font-body-sm text-body-sm text-ink-muted">End-to-end information security protocols audited annually.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-ink/10 shadow-editorial-subtle flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-ink mb-4">
                <span className="material-symbols-outlined text-3xl text-coral-accent">policy</span>
              </div>
              <h4 className="font-title-md text-title-md font-bold text-ink mb-1">SOC 2 Type II</h4>
              <span className="font-label-sm text-label-sm text-ink-muted mb-2">Continuous Attestation</span>
              <p className="font-body-sm text-body-sm text-ink-muted">Confidentiality, availability, and processing integrity assured.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-ink/10 shadow-editorial-subtle flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-ink mb-4">
                <span className="material-symbols-outlined text-3xl text-pink-accent">gavel</span>
              </div>
              <h4 className="font-title-md text-title-md font-bold text-ink mb-1">GFR 2017 Clause 144(xi)</h4>
              <span className="font-label-sm text-label-sm text-ink-muted mb-2">Land Border Compliance</span>
              <p className="font-body-sm text-body-sm text-ink-muted">Automated verification of sovereign beneficial ownership mandates.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-ink/10 shadow-editorial-subtle flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-ink mb-4">
                <span className="material-symbols-outlined text-3xl text-sky-accent">cloud_done</span>
              </div>
              <h4 className="font-title-md text-title-md font-bold text-ink mb-1">MeitY Empanelled</h4>
              <span className="font-label-sm text-label-sm text-ink-muted mb-2">Govt of India Cloud</span>
              <p className="font-body-sm text-body-sm text-ink-muted">Empanelled for critical and sensitive central procurement data hosting.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="w-full bg-ink text-cream border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg font-bold text-cream tracking-tight mb-8">
              Ready to experience GemOne?
            </h2>
            {user ? (
              <button 
                onClick={() => navigate(`/${role}/tenders`)}
                className="px-8 py-3.5 rounded-full bg-teal-accent hover:bg-teal-accent/90 text-ink font-title-md text-title-md font-bold shadow-editorial-elevated active:scale-[0.98] transition-all duration-150 inline-flex items-center gap-2"
              >
                Go to Dashboard
                <span className="material-symbols-outlined text-ink">arrow_forward</span>
              </button>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="px-8 py-3.5 rounded-full bg-surface-container/10 hover:bg-surface-container/20 text-cream font-title-md text-title-md font-semibold border border-white/20 shadow-editorial-subtle transition-all duration-150"
                >
                  Log In
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="px-8 py-3.5 rounded-full bg-teal-accent hover:bg-teal-accent/90 text-ink font-title-md text-title-md font-bold shadow-editorial-elevated active:scale-[0.98] transition-all duration-150"
                >
                  Register
                </button>
              </div>
            )}
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 font-body-sm text-body-sm text-on-primary-container">
            <div>
              © 2026 GemOne. Engineered for SIH.
            </div>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-accent"></span>
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
