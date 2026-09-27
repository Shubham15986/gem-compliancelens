import { useState } from 'react';
import { 
  Lock, Database, UploadCloud, Cpu, FolderSync, Settings, FileLock2, FileSearch, CheckCircle2, ShieldCheck, Eye, Server
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  const [activeTab, setActiveTab] = useState<'officer' | 'bidder'>(user ? (user.role === 'bidder' ? 'bidder' : 'officer') : 'bidder');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const BidderSteps = [
    { 
      id: 1, 
      title: 'Search & Unlock Tenders', 
      desc: 'Browse the Open Marketplace. For Private Tenders, click "Unlock" and enter the secret password provided by the inviting authority.', 
      icon: Lock,
      archText: 'The frontend sends the password securely. The backend intercepts it, validates it against the tender\'s encrypted config, and instantly creates a draft application bypassing the Officer\'s approval queue.',
      archVisual: '[Vendor UI] ➔ POST /unlock ➔ [Backend DB Check] ➔ [Draft Application Created]'
    },
    { 
      id: 2, 
      title: 'Global Vault & Temporary Uploads', 
      desc: 'Upload core documents (PAN, GST) to your permanent Vault. For tender-specific one-off documents, leave "Save to Vault" unchecked to keep your vault clean.', 
      icon: Database,
      archText: 'The Document API detects the is_temporary flag. If true, the file is attached to the current bid but dynamically filtered out of your main Vendor Vault SQL queries.',
      archVisual: '[Upload] ➔ [Cloudinary CDN] ➔ [DB: BidderDocument (is_temporary=true)] ➔ [Hidden from Vault List]'
    },
    { 
      id: 3, 
      title: 'Inline Smart Uploader', 
      desc: 'When you try to submit a bid, the system checks the Officer\'s required rules. If you are missing a document, it blocks submission and forces you to upload it inline.', 
      icon: UploadCloud,
      archText: 'The React frontend evaluates the Tender\'s JSON Rules against your current Vault State. Missing required clauseTypes disable the submit button and trigger the local DocumentUploader component.',
      archVisual: '[Tender JSON Rules] ⟷ [Vendor Vault JSON] ➔ (Mismatch Detected) ➔ [Submit Disabled]'
    },
    { 
      id: 4, 
      title: 'AI OCR & Manual Bypasses', 
      desc: 'Our AI extracts data. If it fails 3 times, you can "Force Manual Review". Custom Documents requested by officers automatically bypass AI.', 
      icon: Cpu,
      archText: 'Tesseract & pdfplumber scan the file. If the 3-strike counter hits max, or the docType starts with "custom_", the system gracefully degrades the ocr_status to "needs_manual_review".',
      archVisual: '[Document] ➔ [OCR Engine] ➔ (Failure / Custom Doc) ➔ [ocr_status="needs_manual_review"] ➔ [Officer Queue]'
    },
    { 
      id: 5, 
      title: 'Withdraw & Resume (Self-Bid Check)', 
      desc: 'Withdraw active applications anytime. If you try to re-apply to the same tender, the system intelligently drops you back into your existing dashboard.', 
      icon: FolderSync,
      archText: 'The Bid creation API performs a composite unique check (tender_id + bidder_id). Instead of a 500 crash on duplicate, it intercepts it and returns the existing application ID for seamless redirection.',
      archVisual: 'POST /bids ➔ [DB Composite Key Check] ➔ (Exists) ➔ [Returns Existing ID] ➔ [Resume UI]'
    },
  ];

  const OfficerSteps = [
    { 
      id: 11, 
      title: 'Create & Configure Rules', 
      desc: 'Create a tender and use the Rule Engine to define financial thresholds, dates, and required documents.', 
      icon: Settings,
      archText: 'Officer inputs are serialized into a strict JSON payload. The backend Deterministic AST Engine uses this JSON to mathematically evaluate vendor data later, eliminating LLM hallucinations.',
      archVisual: '[UI Inputs] ➔ [JSON Rule Serialization] ➔ [AST Deterministic Rule Engine Payload]'
    },
    { 
      id: 12, 
      title: 'Private Tenders & Passwords', 
      desc: 'Toggle a tender to "Private" and set an Access Password. Vendors must know this password to apply.', 
      icon: FileLock2,
      archText: 'The rules configuration API updates the tender\'s access_type and stores the private_password securely. This enables the Vendor Unlock flow and deprecates the manual access queue.',
      archVisual: 'PUT /tenders/{id} ➔ {access_type: "private", private_password: "***"} ➔ [Marketplace Locked]'
    },
    { 
      id: 13, 
      title: 'Custom Document Requests', 
      desc: 'Need a specific file that the AI doesn\'t know about? Add a "Custom Required Document". The system will force vendors to upload it.', 
      icon: FileSearch,
      archText: 'Custom names are slugified with a "custom_" prefix and pushed to the rules array. The AI engine ignores these prefixes, automatically flagging them for human verification.',
      archVisual: '["Financial Report"] ➔ ["custom_financial_report"] ➔ [Bypasses OCR] ➔ [Manual Verification Queue]'
    },
    { 
      id: 14, 
      title: 'AI Scorecard & Manual Review', 
      desc: 'Evaluate bids instantly. The AST rule engine matches data against thresholds. You manually review flagged Custom Documents.', 
      icon: CheckCircle2,
      archText: 'The Evaluation Service runs the Vault data against the Rules JSON. Results are fed into Google Gemini (with an automatic fallback to gemini-pro on 404) to generate plain-English explanations.',
      archVisual: '[AST Logic] ➔ [Pass/Fail Generated] ➔ [Gemini API / LLM Fallback] ➔ [Officer Scorecard]'
    },
    { 
      id: 15, 
      title: 'Cancel Tender & Audit Trail', 
      desc: 'You can cancel a tender at any time to halt applications. Every action is cryptographically logged in the Audit Trail.', 
      icon: ShieldCheck,
      archText: 'Every state change triggers an Audit Log insert. Each row computes a SHA-256 hash chaining the previous row\'s hash, creating an immutable pseudo-blockchain for government auditing.',
      archVisual: '[State Change] ➔ [SHA-256(Previous Hash + Payload)] ➔ [Immutable Audit DB]'
    },
  ];

  const steps = activeTab === 'bidder' ? BidderSteps : OfficerSteps;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNav = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (path.startsWith('#')) {
      scrollToSection(path.substring(1));
    } else if (path.startsWith('http')) {
      window.open(path, '_blank');
    } else {
      navigate(path);
    }
  };

  return (
    <div className="bg-cream text-ink antialiased font-body-md selection:bg-teal-accent selection:text-white">
      {/* STICKY NAV */}
      <header className="sticky top-0 z-50 w-full bg-cream shadow-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 lg:px-10 h-20">
          <a className="flex items-center gap-3 group cursor-pointer" onClick={(e) => handleNav(e, '#')} href="#">
            <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-cream shadow-editorial-subtle group-hover:scale-105 transition-transform duration-200">
              <span className="material-symbols-outlined text-teal-accent">policy</span>
            </div>
            <span className="font-headline-sm text-headline-sm font-bold text-ink tracking-tight">GemOne</span>
          </a>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-ink font-title-sm text-title-sm font-semibold border-b-2 border-ink pb-1 flex items-center gap-1 cursor-pointer" onClick={(e) => handleNav(e, '#engine')}>
              Analysis Engine
            </a>
            <a className="text-ink-muted font-title-sm text-title-sm font-medium hover:text-ink transition-colors duration-150 flex items-center gap-1 cursor-pointer" onClick={(e) => handleNav(e, '#defensibility')}>
              Defensibility
            </a>
            <a className="text-ink-muted font-title-sm text-title-sm font-medium hover:text-ink transition-colors duration-150 flex items-center gap-1 cursor-pointer" onClick={(e) => handleNav(e, '#journeys')}>
              Workflows
            </a>
            <a className="text-ink-muted font-title-sm text-title-sm font-medium hover:text-ink transition-colors duration-150 cursor-pointer" onClick={(e) => handleNav(e, 'https://github.com/Shubham15986/gem-compliancelens')}>
              GitHub Repo
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
              <a className="px-5 py-2.5 rounded-full bg-teal-accent text-white font-title-sm text-title-sm font-bold shadow-editorial-subtle active:scale-[0.98] transition-all duration-150 flex items-center gap-2 cursor-pointer" onClick={(e) => handleNav(e, user.role === 'officer' ? '/officer/tenders' : '/bidder/tenders')}>
                <span>Go to Dashboard</span>
                <span className="material-symbols-outlined text-sm text-white">dashboard</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 px-6 lg:px-10 overflow-hidden" id="hero">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface-container border border-ink/10 mb-8 shadow-editorial-subtle">
            <span className="w-2 h-2 rounded-full bg-teal-accent animate-pulse"></span>
            <span className="font-label-md text-label-md text-ink uppercase tracking-wider">SIH 26100 • AST RULE ENGINE v4.2</span>
          </div>
          <h1 className="font-display text-display-mobile lg:text-display text-ink tracking-tight max-w-4xl mx-auto mb-6">
            Government procurement forensics, solved together.
          </h1>
          <p className="font-body-lg text-body-lg text-ink-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            GemOne turns complex tender documents, GST filings, and statutory checks into instant, CAG-defensible compliance verdicts using deterministic rule engines.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button onClick={() => { setActiveTab('bidder'); scrollToSection('journeys'); }} className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-ink hover:bg-ink-dark text-cream font-title-md text-title-md font-bold shadow-editorial-elevated active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer">
              <span>Explore Bidder Journey</span>
              <span className="material-symbols-outlined text-coral-accent">account_circle</span>
            </button>
            <button onClick={() => { setActiveTab('officer'); scrollToSection('journeys'); }} className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white hover:bg-surface-container text-ink font-title-md text-title-md font-semibold border border-ink/20 shadow-editorial-subtle transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-ink-muted">gavel</span>
              <span>Explore Officer Journey</span>
            </button>
          </div>

          {/* Graphic Hero Banner */}
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
                <span className="font-label-sm text-label-sm text-ink-muted">CVC Integrity Pass</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-xl bg-surface-container/60 border border-ink/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-title-sm text-title-sm text-ink font-bold">Bharat Electronics & Surveillance Corp</span>
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
                      <div className="font-label-sm text-label-sm text-ink-muted">Turnover Rule</div>
                      <div className="font-title-sm text-title-sm text-ink font-bold text-ink">₹142.8 Cr</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-ink/10">
                      <div className="font-label-sm text-label-sm text-ink-muted">Cryptographic Log</div>
                      <div className="font-title-sm text-title-sm text-ink font-bold text-teal-accent">SHA-256 Chained</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-ink-muted font-body-sm text-body-sm px-2">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-accent text-sm">commit</span>
                    Deterministic tree: Rule GFR-144(xi) Cross-Check
                  </span>
                  <span className="text-ink font-semibold">Passed (Hash: 8f2a...c01e)</span>
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
                    <span className="font-body-sm text-body-sm text-ink">Zero statutory conflicts with OEM schedule</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-teal-accent text-sm mt-0.5">task_alt</span>
                    <span className="font-body-sm text-body-sm text-ink">Cryptographic timestamp via Hash Ledger</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-teal-accent text-sm mt-0.5">task_alt</span>
                    <span className="font-body-sm text-body-sm text-ink">Blacklist scrub clean via CPPP Rules</span>
                  </li>
                </ul>
                <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-ink-muted">Audit Pack Generated</span>
                  <span className="font-title-sm text-title-sm font-bold text-ink">Immutable SQL Ledger</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST & PARTNER BAR */}
      <section className="border-y border-ink/10 bg-cream py-8 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-label-md text-label-md text-ink-muted uppercase tracking-wider shrink-0 text-center md:text-left">
            Built to fulfill Problem Statement 26100 (SIH 2026)
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-8 lg:gap-12 opacity-85">
            <div className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-ink tracking-tight">
              <span className="material-symbols-outlined text-ink">shopping_cart</span>
              <span>GeM</span>
            </div>
            <div className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-ink tracking-tight">
              <span className="material-symbols-outlined text-ink">terminal</span>
              <span>CPCL</span>
            </div>
            <div className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-ink tracking-tight">
              <span className="material-symbols-outlined text-ink">security</span>
              <span>CVC Standards</span>
            </div>
          </div>
        </div>
      </section>

      {/* ALTERNATING FEATURE BLOCKS */}
      <section className="py-20 lg:py-28 px-6 lg:px-10 max-w-7xl mx-auto space-y-24" id="engine">
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
              Generic LLMs fabricate numbers. GemOne relies on an Abstract Syntax Tree (AST) engine to cross-check GST returns, balance sheet notes, and GeM eligibility rules with absolute mathematical determinism.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-center gap-3 font-title-sm text-title-sm text-ink">
                <span className="w-5 h-5 rounded-full bg-teal-accent/20 text-teal-accent flex items-center justify-center font-bold text-xs">✓</span>
                Tesseract & pdfplumber extraction routes
              </li>
              <li className="flex items-center gap-3 font-title-sm text-title-sm text-ink">
                <span className="w-5 h-5 rounded-full bg-teal-accent/20 text-teal-accent flex items-center justify-center font-bold text-xs">✓</span>
                AST evaluates thresholds mathematically
              </li>
              <li className="flex items-center gap-3 font-title-sm text-title-sm text-ink">
                <span className="w-5 h-5 rounded-full bg-teal-accent/20 text-teal-accent flex items-center justify-center font-bold text-xs">✓</span>
                Gemini API used strictly for generating readable explanations
              </li>
            </ul>
            <div className="pt-4">
              <button onClick={() => { setActiveTab('officer'); scrollToSection('journeys'); }} className="inline-flex items-center gap-2 font-title-md text-title-md text-ink font-bold hover:gap-3 transition-all duration-150 group cursor-pointer">
                <span>See it in the Officer Journey</span>
                <span className="material-symbols-outlined text-teal-accent group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>
          <div className="lg:col-span-6 bg-white rounded-2xl border border-ink/10 p-6 shadow-editorial-elevated">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4 mb-4">
              <div>
                <span className="font-title-sm text-title-sm text-ink font-bold block">Tax & Statutory Compliance Dossier</span>
                <span className="font-label-sm text-label-sm text-ink-muted">Extracted via Smart Pipeline</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-teal-accent/15 text-teal-accent font-label-md text-label-md font-bold">
                Passes AST Rules
              </span>
            </div>
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-surface-container border border-ink/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-teal-accent">account_balance</span>
                  <div>
                    <div className="font-title-sm text-title-sm text-ink font-semibold">GSTIN: 07AAACB2194L1Z9</div>
                    <div className="font-body-sm text-body-sm text-ink-muted">Extracted via OCR Engine</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white text-ink font-label-md text-label-md font-bold border border-ink/10">Active</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-container border border-ink/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-title-sm text-title-sm text-ink font-semibold">Financial Turnover Rule Match</span>
                  <span className="font-label-md text-label-md font-bold text-ink">₹84.50 Cr / req ₹50.00 Cr</span>
                </div>
                <div className="w-full bg-outline-variant/30 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-accent h-full w-[169%] max-w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center" id="vault">
          <div className="lg:col-span-6 order-2 lg:order-1 bg-white rounded-2xl border border-ink/10 p-6 shadow-editorial-elevated">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-pink-accent">document_scanner</span>
                <span className="font-title-sm text-title-sm text-ink font-bold">Smart Gatekeeper</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-pink-accent/15 text-pink-accent font-label-md text-label-md font-bold">
                Missing 1 File
              </span>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-ink/10 bg-surface-container-lowest">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-title-sm text-title-sm text-ink font-bold block">Permanent Account No (PAN)</span>
                    <span className="font-body-sm text-body-sm text-ink-muted">Found in Global Vault</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-teal-accent/20 text-teal-accent font-label-sm text-label-sm font-bold">VERIFIED</span>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-ink/10 bg-surface-container-lowest">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-title-sm text-title-sm text-ink font-bold block">Custom Audit Request</span>
                    <span className="font-body-sm text-body-sm text-ink-muted">Not Found in Vault</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-error-container text-error font-label-sm text-label-sm font-bold">REQUIRED</span>
                </div>
                <p className="font-body-sm text-body-sm text-ink-muted">Submission locked until this file is uploaded inline.</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-accent/15 text-coral-accent font-label-md text-label-md font-bold">
              <span className="material-symbols-outlined text-sm">fingerprint</span>
              Global Document Vault
            </div>
            <h2 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-ink font-bold tracking-tight">
              Stop uploading PAN cards. Build a reusable vault.
            </h2>
            <p className="font-body-lg text-body-lg text-ink-muted leading-relaxed">
              Vendors upload core documents once. When applying, the Smart Gatekeeper checks the Officer's JSON rules against the Vault. Missing a document? The submit button dynamically locks until it's uploaded inline.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-center gap-3 font-title-sm text-title-sm text-ink">
                <span className="w-5 h-5 rounded-full bg-coral-accent/20 text-coral-accent flex items-center justify-center font-bold text-xs">✓</span>
                0% incomplete applications reach the officer
              </li>
              <li className="flex items-center gap-3 font-title-sm text-title-sm text-ink">
                <span className="w-5 h-5 rounded-full bg-coral-accent/20 text-coral-accent flex items-center justify-center font-bold text-xs">✓</span>
                Support for isolated, one-off temporary bid documents
              </li>
              <li className="flex items-center gap-3 font-title-sm text-title-sm text-ink">
                <span className="w-5 h-5 rounded-full bg-coral-accent/20 text-coral-accent flex items-center justify-center font-bold text-xs">✓</span>
                Private Passwords allow exclusive restricted bidding
              </li>
            </ul>
            <div className="pt-4">
              <button onClick={() => { setActiveTab('bidder'); scrollToSection('journeys'); }} className="inline-flex items-center gap-2 font-title-md text-title-md text-ink font-bold hover:gap-3 transition-all duration-150 group cursor-pointer">
                <span>See it in the Bidder Journey</span>
                <span className="material-symbols-outlined text-coral-accent group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SVG Wave */}
      <div className="w-full overflow-hidden leading-none -mb-1">
        <svg className="block w-full h-16 md:h-24 text-indigo-dark fill-current" preserveAspectRatio="none" viewBox="0 0 1440 120">
          <path d="M0,32L80,42.7C160,53,320,75,480,80C640,85,800,75,960,58.7C1120,43,1280,21,1360,10.7L1440,0L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </div>

      {/* DARK SECTION: Defensibility */}
      <section className="bg-indigo-dark text-white py-20 lg:py-28 px-6 lg:px-10" id="defensibility">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-accent font-label-md text-label-md font-bold mb-4">
              <span className="material-symbols-outlined text-sm">balance</span>
              Statutory Sovereign Rigor
            </div>
            <h2 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg font-bold tracking-tight mb-4 text-white">
              Engineered for CAG court-proof defensibility.
            </h2>
            <p className="font-body-lg text-body-lg text-on-primary-container leading-relaxed">
              Every compliance call, qualification rejection, or score allotment executed in GemOne produces an immutable evidentiary trail.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 text-ink shadow-editorial-elevated">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-ink/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center text-ink">
                    <span className="material-symbols-outlined">account_tree</span>
                  </div>
                  <div>
                    <h3 className="font-title-lg text-title-lg font-bold text-ink">3-Strike Degradation</h3>
                    <span className="font-label-md text-label-md text-ink-muted">Graceful Fallback Logic</span>
                  </div>
                </div>
                <span className="w-3 h-3 rounded-full bg-teal-accent"></span>
              </div>
              <p className="font-body-md text-body-md text-ink-muted mb-6">
                Most automated systems lock vendors out if AI fails. GemOne implements a 3-strike counter. If OCR fails repeatedly, or if a "Custom Document" is uploaded, the system bypasses auto-rejection and flags it for Manual Review.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-ink shadow-editorial-elevated">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-ink/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center text-ink">
                    <span className="material-symbols-outlined">verified_user</span>
                  </div>
                  <div>
                    <h3 className="font-title-lg text-title-lg font-bold text-ink">Cryptographic Chaining</h3>
                    <span className="font-label-md text-label-md text-ink-muted">PostgreSQL Pseudo-Blockchain</span>
                  </div>
                </div>
                <span className="w-3 h-3 rounded-full bg-teal-accent"></span>
              </div>
              <p className="font-body-md text-body-md text-ink-muted mb-6">
                Every action is saved in the audit log by computing a SHA-256 hash that chains the previous row's hash. Any tampering by rogue database admins breaks the math, making the system immune to insider tampering.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SVG Wave */}
      <div className="w-full overflow-hidden leading-none -mt-1 -mb-1 bg-indigo-dark">
        <svg className="block w-full h-16 md:h-24 text-cream fill-current" preserveAspectRatio="none" viewBox="0 0 1440 120">
          <path d="M0,64L80,69.3C160,75,320,85,480,74.7C640,64,800,32,960,26.7C1120,21,1280,43,1360,53.3L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </div>

      {/* ARCHITECTURE JOURNEYS */}
      <section className="bg-cream py-20 lg:py-28 px-6 lg:px-10" id="journeys">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Interactive Workflow Architecture</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Click a step below to reveal the exact technical architecture that powers the GemOne engine.
            </p>
          </div>

          {!user && (
            <div className="flex justify-center mb-12">
              <div className="inline-flex bg-slate-200/50 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('bidder')}
                  className={cn(
                    "px-8 py-3 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer",
                    activeTab === 'bidder' ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Bidder Journey
                </button>
                <button
                  onClick={() => setActiveTab('officer')}
                  className={cn(
                    "px-8 py-3 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer",
                    activeTab === 'officer' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Officer Journey
                </button>
              </div>
            </div>
          )}

          {user && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
              <Eye className="text-blue-600" />
              <p className="text-blue-800 font-medium">Viewing journey personalized for your role: <span className="uppercase font-bold">{user.role}</span></p>
            </div>
          )}

          <div className="space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isExpanded = expandedStep === step.id;
              
              return (
                <div 
                  key={step.id} 
                  className={cn(
                    "bg-white border rounded-2xl overflow-hidden transition-all duration-300",
                    isExpanded ? "border-blue-300 shadow-md" : "border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md"
                  )}
                >
                  <div 
                    className="p-6 cursor-pointer flex gap-6 items-start"
                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  >
                    <div className={cn(
                      "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      activeTab === 'bidder' ? "bg-blue-100 text-blue-600" : "bg-indigo-100 text-indigo-600"
                    )}>
                      <Icon size={24} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-slate-800">
                          <span className="text-slate-400 mr-2">{index + 1}.</span> 
                          {step.title}
                        </h3>
                        <button className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                          {isExpanded ? 'Hide Architecture' : 'View Architecture'}
                        </button>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50">
                      <div className="mt-4 mb-2">
                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                          <Server size={16} /> Technical Architecture
                        </h4>
                        <p className="text-sm text-slate-600 mb-4">{step.archText}</p>
                        
                        <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs sm:text-sm text-green-400 overflow-x-auto shadow-inner">
                          {step.archVisual}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-indigo-dark text-cream border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12 mb-16">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-ink-dark flex items-center justify-center text-teal-accent border border-white/10">
                  <span className="material-symbols-outlined">policy</span>
                </div>
                <span className="font-headline-sm text-headline-sm font-bold text-cream tracking-tight">GemOne</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-primary-container max-w-xs leading-relaxed">
                The sovereign procurement forensics platform for Indian public tenders, GeM auctions, and CAG court-proof defensibility.
              </p>
              <div className="pt-2 flex items-center gap-3 text-on-primary-container">
                <span className="material-symbols-outlined text-sm text-teal-accent">lock</span>
                <span className="font-label-sm text-label-sm">SHA-256 Sovereign Cryptography</span>
              </div>
            </div>
            <div>
              <h4 className="font-title-sm text-title-sm font-semibold text-cream mb-4">Product</h4>
              <ul className="space-y-2.5 font-body-sm text-body-sm text-on-primary-container">
                <li><a className="hover:text-cream transition-colors cursor-pointer" onClick={(e) => handleNav(e, '#engine')}>Analysis Engine</a></li>
                <li><a className="hover:text-cream transition-colors cursor-pointer" onClick={(e) => handleNav(e, '#vault')}>Global Vault</a></li>
                <li><a className="hover:text-cream transition-colors cursor-pointer" onClick={(e) => handleNav(e, '#journeys')}>Workflows</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-title-sm text-title-sm font-semibold text-cream mb-4">Repo</h4>
              <ul className="space-y-2.5 font-body-sm text-body-sm text-on-primary-container">
                <li><a className="hover:text-cream transition-colors cursor-pointer" onClick={(e) => handleNav(e, 'https://github.com/Shubham15986/gem-compliancelens')}>Source Code</a></li>
                <li><a className="hover:text-cream transition-colors cursor-pointer" onClick={(e) => handleNav(e, 'https://github.com/Shubham15986/gem-compliancelens/issues')}>Issues</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 font-body-sm text-body-sm text-on-primary-container">
            <div>© 2026 GemOne. Built for SIH Problem Statement 26100.</div>
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
