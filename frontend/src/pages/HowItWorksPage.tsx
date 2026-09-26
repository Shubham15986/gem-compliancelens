import { useState } from 'react';
import { 
  Building2, UserCheck, UploadCloud, FileSearch, ShieldCheck, 
  Send, Bell, MessageSquare, Scale, Fingerprint, Database, AlertCircle, FileLock2, Languages
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<'officer' | 'bidder'>('officer');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const navigate = useNavigate();
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || 'officer';

  const BidderSteps = [
    { id: 1, title: 'Register & Log In', desc: 'Securely authenticate as a vendor on the platform.', detail: 'Vendors can seamlessly sign up to the portal. Uses secure JWT authentication simulating standard government SSO.', icon: UserCheck, status: 'Live' },
    { id: 2, title: 'Browse Open Tenders', desc: 'View eligibility requirements and custom rules upfront before applying.', detail: 'Bidders can view all published tenders. Each tender clearly lists its mathematical compliance rules (like Local Content thresholds or Turnover requirements) configured by the Procurement Officer.', icon: Building2, status: 'Live' },
    { id: 3, title: 'Upload Documents', desc: 'Securely upload PDFs and Images for automated processing.', detail: 'We built a secure Vault for bidders to drop their PAN, GSTIN, and Udyam certificates. The system natively accepts both PDFs and raw Images (JPG/PNG).', icon: UploadCloud, status: 'Live' },
    { id: 4, title: 'Fetch via DigiLocker', desc: 'Pull verified documents directly from the government repository.', detail: 'Instead of manual uploads, bidders can click "Fetch via DigiLocker". This launches an OAuth consent screen to securely pull cryptographically signed documents directly from the source, bypassing OCR entirely.', icon: Database, status: 'Demo Mode' },
    { id: 5, title: 'Real-time AI Extraction', desc: 'Instantly view OCR-extracted fields from your uploaded documents.', detail: 'The moment a file is uploaded, our Tesseract + pdfplumber AI engine scans the document, parses the unstructured text, and extracts the exact compliance variables needed. Missing required fields instantly trigger a rejection to prevent bad data.', icon: FileSearch, status: 'Live' },
    { id: 6, title: 'Pre-Bid Readiness Score', desc: 'Check if you meet the specific tender requirements before submitting.', detail: 'Our platform generates a /100 Readiness Score on the Bidder dashboard, giving vendors a clear indicator of whether their Vault contains the necessary documents to pass the upcoming Rule Engine evaluation.', icon: ShieldCheck, status: 'Live' },
    { id: 7, title: 'Submit Application', desc: 'Send your completed vault and compliance data for officer review.', detail: 'Once the Vault is ready, a single click packages the Bidder Profile and all attached documents into a frozen snapshot submitted directly to the Procurement Officer.', icon: Send, status: 'Live' },
    { id: 8, title: 'Track Application Status', desc: 'Monitor where your bid is in the evaluation pipeline.', detail: 'The dashboard updates in real-time as the Officer evaluates the bid, changing status from Pending -> Under Review -> Clarification -> Accepted/Rejected.', icon: Bell, status: 'Live' },
    { id: 9, title: 'Respond to Clarifications', desc: 'Directly answer queries from Procurement Officers.', detail: 'If the Officer flags a document (e.g. a blurry image), they can open a clarification loop. The Bidder can respond directly through the portal without needing external emails.', icon: MessageSquare, status: 'Live' },
    { id: 10, title: 'Receive Final Decision', desc: 'Get a plain-language explanation of your qualification or disqualification.', detail: 'If disqualified, the Bidder doesn\'t just get a "Failed" badge. They receive the exact generated explanation of which rule they failed (e.g., "Your turnover of 4L is below the 5L threshold").', icon: Scale, status: 'Live' },
  ];

  const OfficerSteps = [
    { id: 1, title: 'Log In to Dashboard', desc: 'Access the centralized procurement officer interface.', detail: 'Officers log into a specialized, high-security dashboard designed to evaluate hundreds of bids quickly and efficiently.', icon: UserCheck, status: 'Live' },
    { id: 2, title: 'Configure Tender Rules', desc: 'Use the RulesConfig to set exact thresholds.', detail: 'Officers can dynamically build compliance requirements for a new tender using our Rules Engine UI. They can define mandatory flags, minimum turnover, local content percentages, and specific document requirements.', icon: Building2, status: 'Live' },
    { id: 3, title: 'View Bid Queue', desc: 'Monitor all submitted applications for your active tenders.', detail: 'A streamlined Kanban-style table showing all bidders who have submitted their vaults, ordered by submission time.', icon: Database, status: 'Live' },
    { id: 4, title: 'Automated Compliance Check', desc: 'The Rule Engine evaluates OCR data mathematically against your rules.', detail: 'Instead of manually reading documents, the Officer clicks "Evaluate". Our Abstract Syntax Tree (AST) deterministic engine calculates the exact pass/fail state for every rule simultaneously.', icon: FileSearch, status: 'Live' },
    { id: 5, title: 'Review Scorecard', desc: 'Instantly see the overall Compliance Score and Risk Level.', detail: 'The engine generates a 0-100 Scorecard and a Low/Medium/High Risk level based on the evaluation, highlighting exactly what failed.', icon: ShieldCheck, status: 'Live' },
    { id: 6, title: 'Drill-Down Explanations', desc: 'Click any check to see the plain-language reasoning and evidence.', detail: 'When an Officer clicks a failed check, they see exactly WHY it failed (e.g. "Vendor uploaded an expired GSTIN") and a side-by-side view of the uploaded document evidence.', icon: AlertCircle, status: 'Live' },
    { id: 7, title: '1-Click Verification', desc: 'Cross-check flagged items with government portals manually if needed.', detail: 'If the OCR fails 3 times, the system gracefully degrades to manual review. The Officer can view the blurry document, manually verify it against the CPPP portal, and explicitly override the AI.', icon: UserCheck, status: 'Live' },
    { id: 8, title: 'Document Forensics', desc: 'Review PDF Metadata, Cryptographic Hashes, and ELA image analysis.', detail: 'The system runs forensic checks in the background. Officers are alerted if the PDF was manipulated in Photoshop (Metadata), if the image pixels are edited (ELA), or if the file hash was reused by another bidder (Collusion).', icon: Fingerprint, status: 'Live' },
    { id: 9, title: 'Clarification & Decision', desc: 'Request more info from the bidder or submit the final verdict.', detail: 'Officers can pause evaluation to ask the Bidder a direct question, or hit "Accept/Reject" to finalize the bid evaluation.', icon: Scale, status: 'Live' },
    { id: 10, title: 'Immutable Audit Trail', desc: 'View the cryptographically chained timeline for CVC/CAG defensibility.', detail: 'Every single action (upload, evaluate, override, decision) writes a SHA-256 hash to a PostgreSQL pseudo-blockchain. This guarantees the evaluation history cannot be tampered with by malicious actors.', icon: FileLock2, status: 'Live' },
  ];

  const Roadmap = [
    { 
      title: 'Live Government APIs', 
      desc: 'Swap Demo Provider for Live OAuth keys (GSTN, MCA, DigiLocker).', 
      icon: Database,
      issueId: 17,
      limitation: 'Requires institutional partnership and secure API keys from Govt of India, unavailable during a public hackathon.'
    },
    { 
      title: 'Multilingual UI (i18n)', 
      desc: 'Full localization for Hindi and regional languages.', 
      icon: Languages,
      issueId: 19,
      limitation: 'Architectural overhead. Requires massive translation dictionaries which distracts from the core AI extraction MVP.'
    },
    { 
      title: 'Deepfake & AI Fraud', 
      desc: 'Advanced ML models to detect synthetic generative documents.', 
      icon: ShieldCheck,
      issueId: 15,
      limitation: 'Requires specialized GPU instances and large datasets of deepfake documents for training, constrained by free-tier hosting.'
    },
    { 
      title: 'Database PII Encryption', 
      desc: 'AES-256 encryption at rest for all bidder sensitive data.', 
      icon: FileLock2,
      issueId: 13,
      limitation: 'Adds significant latency to the OCR pipeline. Deferred to production deployment.'
    },
  ];

  const getBadgeColor = (status: string) => {
    switch(status) {
      case 'Live': return 'bg-green-100 text-green-800 border-green-200';
      case 'Demo Mode': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Coming Soon': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const steps = activeTab === 'officer' ? OfficerSteps : BidderSteps;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">G</div>
          <span className="font-bold text-xl text-slate-800">GemOne <span className="text-sm font-medium text-slate-400 ml-2">| Platform Tour</span></span>
        </div>
        {user ? (
          <button 
            onClick={() => navigate(`/${role}/tenders`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
          >
            Go to Dashboard &rarr;
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/login')}
              className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
            >
              Log In
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
            >
              Register &rarr;
            </button>
          </div>
        )}
      </header>
      
      <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4">
      
      {/* Hero Section */}
      <section className="text-center pt-8 space-y-6">
        <div className="w-16 h-16 mx-auto bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
          G
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          GemOne
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
          An AI-enabled integrated platform for automated verification of bidder compliance in GeM procurement. 
          Upload documents, extract fields via AI, and automatically evaluate bids against deterministic rules.
        </p>
        
        <div className="flex items-center justify-center gap-4 pt-4">
          {user ? (
            <button 
              onClick={() => navigate(`/${role}/tenders`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg"
            >
              Go to Dashboard &rarr;
            </button>
          ) : (
            <>
              <button 
                onClick={() => navigate('/login')}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-3 rounded-lg font-bold transition-colors shadow-sm"
              >
                Log In
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg"
              >
                Register &rarr;
              </button>
            </>
          )}
        </div>
        
        {/* Link to SIH Matrix */}
        <div className="pt-8">
          <button 
            onClick={() => navigate('/sih-compliance')}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors border border-blue-200"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            View SIH Requirements Matrix & Flowchart &rarr;
          </button>
        </div>
      </section>

      {/* Role Journey */}
      <section id="how-it-works" className="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-2xl font-bold text-slate-900">
            How It Works: {activeTab === 'officer' ? 'Officer' : 'Bidder'} Journey
          </h2>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('officer')}
              className={cn("px-4 py-2 rounded-md text-sm font-bold transition-all", activeTab === 'officer' ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700")}
            >
              Procurement Officer
            </button>
            <button 
              onClick={() => setActiveTab('bidder')}
              className={cn("px-4 py-2 rounded-md text-sm font-bold transition-all", activeTab === 'bidder' ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700")}
            >
              Bidder / Vendor
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {steps.map((step, idx) => {
            const isExpanded = expandedStep === step.id;
            return (
              <div 
                key={step.id} 
                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                className={cn(
                  "relative bg-slate-50 border rounded-xl p-5 transition-all cursor-pointer group",
                  isExpanded ? "border-blue-300 shadow-md ring-2 ring-blue-100 bg-white" : "border-slate-200 hover:shadow-md hover:border-blue-200"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-colors", isExpanded ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white")}>
                    <step.icon size={20} />
                  </div>
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", getBadgeColor(step.status))}>
                    {step.status}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <span className={cn("text-sm", isExpanded ? "text-blue-600 font-bold" : "text-slate-400")}>{idx + 1}.</span> {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
                
                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-slate-700 leading-relaxed bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                      {step.detail}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section id="features" className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Platform Capabilities Explained</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" /> Deterministic Rule Engine
            </h3>
            <p className="text-sm text-slate-600">
              Unlike other platforms that use hallucination-prone LLMs to make final decisions, our AI is strictly limited to <strong>Data Extraction</strong>. The actual Pass/Fail verdicts are calculated mathematically by an Abstract Syntax Tree (AST) Rule Engine, guaranteeing that the same input always gives the exact same output.
            </p>
          </div>
          
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-blue-600" /> Layered Document Forensics
            </h3>
            <p className="text-sm text-slate-600">
              We go beyond basic OCR text matching. We analyze the hidden <strong>PDF Metadata</strong> to catch Adobe Photoshop manipulation. We run <strong>Error Level Analysis (ELA)</strong> on image pixels. We check cryptographic hashes to detect bidders sharing identical fake documents to simulate competition.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" /> Three-State Verdict System
            </h3>
            <p className="text-sm text-slate-600">
              Ambiguous edge cases are never auto-rejected. The system categorizes results into: <strong>Compliant</strong>, <strong>Non-Compliant</strong>, and <strong>Needs Review</strong>. If the AI cannot read a blurry document after 3 strikes, it degrades gracefully to the manual review queue, ensuring zero operational downtime.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
              <FileLock2 className="w-5 h-5 text-blue-600" /> Immutable Pseudo-Blockchain
            </h3>
            <p className="text-sm text-slate-600">
              For complete CVC/CAG defensibility, every action is logged into an immutable <strong>Cryptographic Hash Chain</strong> within our database. Each event computes a SHA-256 hash using the previous row's hash. If a malicious insider alters a record, the chain breaks instantly.
            </p>
          </div>

        </div>
      </section>

      {/* Roadmap & Limitations */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-lg" id="roadmap">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold">What's Next (Post-SIH Roadmap)</h2>
          <a href="https://github.com/Shubham15986/gem-compliancelens/issues" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
            View Issue Tracker &rarr;
          </a>
        </div>
        <p className="text-slate-400 mb-8 max-w-3xl">
          While the core AI and Rule Engine are fully complete, the following features are officially tracked in our GitHub repository for post-hackathon implementation. We have explicitly documented the technical or institutional limitations that prevented them from being included in the MVP.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Roadmap.map((item, idx) => (
            <div key={idx} className="bg-slate-800 border border-slate-700 p-5 rounded-xl hover:border-blue-500/50 transition-colors relative group">
              <div className="flex justify-between items-start mb-3">
                <item.icon className="w-8 h-8 text-blue-400" />
                <a href={`https://github.com/Shubham15986/gem-compliancelens/issues/${item.issueId}`} target="_blank" rel="noreferrer" className="bg-slate-700/50 text-slate-300 hover:text-white px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors">
                  Issue #{item.issueId}
                </a>
              </div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">{item.desc}</p>
              
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <span className="text-amber-500 text-xs font-bold uppercase tracking-wider block mb-1">Limitation / Blocker</span>
                <p className="text-slate-400 text-xs italic">{item.limitation}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* Footer CTA */}
      <footer className="mt-16 pt-12 pb-8 border-t border-slate-200 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Ready to experience GemOne?</h2>
        {user ? (
          <button 
            onClick={() => navigate(`/${role}/tenders`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-sm"
          >
            Go to Dashboard &rarr;
          </button>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-3 rounded-lg font-bold transition-colors shadow-sm"
            >
              Log In
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-sm"
            >
              Register &rarr;
            </button>
          </div>
        )}
      </footer>

    </div>
    </div>
  );
}
