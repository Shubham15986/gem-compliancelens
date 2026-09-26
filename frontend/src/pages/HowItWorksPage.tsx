import { useState } from 'react';
import { 
  Building2, UserCheck, UploadCloud, FileSearch, ShieldCheck, 
  Send, Bell, MessageSquare, Scale, Database, AlertCircle, 
  FileLock2, Lock, Cpu, Eye, CheckCircle2, Server, FolderSync, Settings
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function HowItWorksPage() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  // If logged out, show tabs. If logged in, force their role.
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

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">How to Use GemOne</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Explore the workflows, features, and underlying technical architecture of the GeM ComplianceLens prototype.
        </p>
      </div>

      {!user && (
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('bidder')}
              className={cn(
                "px-8 py-3 rounded-lg font-medium text-sm transition-all duration-200",
                activeTab === 'bidder' ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Vendor Tutorial
            </button>
            <button
              onClick={() => setActiveTab('officer')}
              className={cn(
                "px-8 py-3 rounded-lg font-medium text-sm transition-all duration-200",
                activeTab === 'officer' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Officer Tutorial
            </button>
          </div>
        </div>
      )}

      {user && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
          <Eye className="text-blue-600" />
          <p className="text-blue-800 font-medium">Viewing tutorial personalized for your role: <span className="uppercase font-bold">{user.role}</span></p>
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
              {/* Header / Clickable Area */}
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
                    <button className="text-sm font-medium text-blue-600 hover:underline">
                      {isExpanded ? 'Hide Architecture' : 'View Architecture'}
                    </button>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>

              {/* Expanded Architecture Section */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50">
                  <div className="mt-4 mb-2">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <Server size={16} /> Technical Architecture
                    </h4>
                    <p className="text-sm text-slate-600 mb-4">{step.archText}</p>
                    
                    {/* Visual Architecture Block */}
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
      
      {!user && (
        <div className="mt-16 text-center">
          <button 
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            Log in to get started
          </button>
        </div>
      )}
    </div>
  );
}
