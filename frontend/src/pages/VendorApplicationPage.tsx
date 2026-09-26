import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DocumentUploader from '../components/DocumentUploader';
import { Upload, CheckCircle2, AlertCircle, Play, FileText, Loader2, MessageSquare, X, ShieldAlert } from "lucide-react";

export default function VendorApplicationPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<any>(null);
  const [docs, setDocs] = useState([]);
  const [clarifications, setClarifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualReviewWarning, setShowManualReviewWarning] = useState(false);
  const [clarificationResponse, setClarificationResponse] = useState("");
  const [tenderRules, setTenderRules] = useState<any[]>([]);
  
  const ruleToDocMap: Record<string, {value: string, label: string}> = {
    'gst_active_and_filed': {value: 'gst_certificate', label: 'GST Registration'},
    'pan_valid': {value: 'pan', label: 'PAN Card'},
    'udyam_valid': {value: 'udyam_certificate', label: 'Udyam/MSME Certificate'},
    'epfo_esic_compliance': {value: 'epfo_esic', label: 'EPFO/ESIC Compliance'},
    'mse_exemption': {value: 'udyam_certificate', label: 'MSE Exemption (Udyam)'}
  };

  const fetchApp = async () => {
    const userStr = localStorage.getItem('user');
    const bidderId = userStr ? JSON.parse(userStr).id : "";
    
    try {
      const [bidsRes, docsRes, clarifRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/bids/mine?bidderId=${bidderId}`).then(r => r.json()),
        fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/bidders/${bidderId}/documents`).then(r => r.json()),
        fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/bids/${appId}/clarifications`).then(r => r.json()).catch(() => [])
      ]);
      
      const currentApp = bidsRes.find((b: any) => b.id === appId);
      setApp(currentApp);
      setDocs(docsRes || []);
      setClarifications(clarifRes || []);

      if (currentApp) {
        // Fetch tender rules to know what is required
        const tRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/tenders/${currentApp.tender_id || currentApp.tenderId || "null"}`);
        if (tRes.ok) {
           const tData = await tRes.json();
           setTenderRules(tData.rules || []);
        } else {
           // Fallback if not found directly by ID (maybe tender_id wasn't in the object, try open tenders list)
           const oRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/tenders/open`);
           const oData = await oRes.json();
           const tenderMatch = oData.find((t: any) => t.title === currentApp.tenderName);
           if (tenderMatch) {
              const trRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/tenders/${tenderMatch.id}`);
              const trData = await trRes.json();
              setTenderRules(trData.rules || []);
           }
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApp();
  }, [appId]);

  const handleWithdraw = async () => {
    if (!window.confirm("Are you sure you want to withdraw this application? This action cannot be undone.")) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/bids/${appId}/withdraw`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to withdraw application");
      toast.success("Application withdrawn successfully");
      await fetchApp();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const attachAndSubmit = async (forceSubmit = false) => {
    // Check missing required docs first
    const requiredTypes = tenderRules
      .filter(r => ruleToDocMap[r.clauseType])
      .map(r => ruleToDocMap[r.clauseType].value);
    
    const vaultTypes = docs.map((d: any) => d.docType);
    const missing = requiredTypes.filter(rt => !vaultTypes.includes(rt));

    if (missing.length > 0 && !forceSubmit) {
       setError("Your vault is missing required documents for this tender. Please upload them below.");
       return;
    }

    const needsReviewDocs = docs.filter((d: any) => d.ocrStatus === 'pending');
    if (needsReviewDocs.length > 0 && !forceSubmit) {
        setShowManualReviewWarning(true);
        return;
    }
    setShowManualReviewWarning(false);
    
    setSubmitting(true);
    setError(null);
    
    try {
      const docIds = docs.map((d: any) => d.id);
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/bids/${appId}/documents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: docIds })
      });
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/bids/${appId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail?.message || "Failed to submit application");
      }
      
      await fetchApp();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitClarificationResponse = async (clarifId: string) => {
    if (!clarificationResponse.trim()) {
       alert("Please enter a response message.");
       return;
    }
    setSubmitting(true);
    setError(null);
    
    const userStr = localStorage.getItem('user');
    const bidderId = userStr ? JSON.parse(userStr).id : "";
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/clarifications/${clarifId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidderId, message: clarificationResponse })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail?.message || "Failed to submit response");
      }
      
      setClarificationResponse("");
      await fetchApp();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading application...</div>;
  if (!app) return <div className="p-8 text-center text-slate-500">Application not found</div>;

  const openClarification = clarifications.find((c: any) => c.status === 'open');

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Application for {app.tenderName}</h1>
            <div className="flex gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">Status: <span className="font-semibold uppercase text-blue-700">{app.status.replace('_', ' ')}</span></span>
            </div>
          </div>
          {app.status === 'draft' ? (
             <button 
                onClick={() => attachAndSubmit(false)}
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                Submit Application
              </button>
          ) : !['qualified', 'disqualified', 'withdrawn', 'draft'].includes(app.status) ? (
             <button 
                onClick={handleWithdraw}
                disabled={submitting}
                className="bg-red-50 text-red-600 border border-red-200 px-6 py-2 rounded shadow-sm hover:bg-red-100 transition flex items-center gap-2 disabled:opacity-50 font-medium"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <X size={18} />}
                Withdraw Application
              </button>
          ) : null}
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3 text-sm">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <div>
              <p className="font-semibold">Action Blocked</p>
              <p>{error}</p>
            </div>
          </div>
        )}

                {showManualReviewWarning && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-xl shadow-sm">
            <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
              <ShieldAlert size={20}/> Warning: Manual Review Required
            </h3>
            <p className="text-sm mb-4">
              One or more of your attached vault documents has been flagged for <strong>Manual Officer Review</strong>. 
              This will significantly delay your bid evaluation. Do you have a clearer copy you'd like to try uploading now?
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/vendor/documents')}
                className="bg-amber-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-amber-700 transition"
              >
                Upload Clearer Copy
              </button>
              <button 
                onClick={() => attachAndSubmit(true)}
                className="bg-white border border-amber-300 text-amber-800 px-4 py-2 rounded text-sm font-medium hover:bg-amber-100 transition"
              >
                Proceed with Manual Review
              </button>
            </div>
          </div>
        )}

        {app.status === 'disqualified' && app.declineReason && (
          <div className="mb-8 border border-red-200 bg-red-50 rounded-xl p-5">
             <div className="flex items-center gap-2 text-red-800 font-semibold mb-3">
                <AlertCircle size={18} /> Application Disqualified
             </div>
             <p className="text-red-900 text-sm mb-2 font-medium">Officer Reasoning for Rejection:</p>
             <p className="text-red-900 text-sm bg-white p-4 rounded border border-red-100">
               {app.declineReason}
             </p>
          </div>
        )}

        {app.status === 'clarification_requested' && openClarification && (
          <div className="mb-8 border border-purple-200 bg-purple-50 rounded-xl p-5">
             <div className="flex items-center gap-2 text-purple-800 font-semibold mb-3">
                <MessageSquare size={18} /> Clarification Requested by Officer
             </div>
             <p className="text-purple-900 text-sm mb-4 bg-white p-3 rounded border border-purple-100">
               {openClarification.message}
             </p>
             
             <div className="space-y-3">
               <label className="text-sm font-medium text-purple-900">Your Response</label>
               <textarea 
                  value={clarificationResponse}
                  onChange={(e) => setClarificationResponse(e.target.value)}
                  placeholder="Provide your clarification or note that you have uploaded new documents in your vault..."
                  className="w-full border border-purple-200 rounded p-3 text-sm focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
               />
               <button 
                  onClick={() => submitClarificationResponse(openClarification.id)}
                  disabled={submitting}
                  className="bg-purple-600 text-white px-4 py-2 rounded font-medium hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  Submit Response & Resume Evaluation
                </button>
             </div>
          </div>
        )}

        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold mb-4">Attached Vault Documents</h2>
          
          {(() => {
             const requiredTypes = tenderRules.filter(r => ruleToDocMap[r.clauseType]).map(r => ruleToDocMap[r.clauseType]);
             const vaultTypes = docs.map((d: any) => d.docType);
             const missingDocs = requiredTypes.filter(rt => !vaultTypes.includes(rt.value));
             
             return (
               <>
                 <p className="text-sm text-slate-500 mb-4">
                   {app.status === 'draft' ? "The following documents from your vault will be attached to this bid upon submission." : "Documents attached to this bid."}
                 </p>
                 
                 {docs.length === 0 ? (
                   <div className="bg-slate-50 p-4 rounded text-center text-slate-500 text-sm mb-4 border border-slate-200">
                     Your vault is empty. Upload the required documents below to proceed.
                   </div>
                 ) : (
                   <div className="space-y-3 mb-6">
                     {docs.map((doc: any) => (
                       <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                         <div className="flex items-center gap-3">
                           <FileText className="text-slate-400" size={20} />
                           <div>
                             <p className="font-medium text-sm uppercase">{doc.docType.replace('_', ' ')}</p>
                             <p className="text-xs text-slate-500">
                               Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                               {doc.isTemporary && <span className="ml-2 text-amber-600 font-semibold">(Temporary)</span>}
                             </p>
                           </div>
                         </div>
                         <div>
                           {doc.ocrStatus === 'done' ? (
                             <span className="flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-100 px-2 py-1 rounded-full"><CheckCircle2 size={14}/> Verified</span>
                           ) : (
                             <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold bg-amber-100 px-2 py-1 rounded-full"><AlertCircle size={14}/> Needs Manual Review</span>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 {app.status === 'draft' && missingDocs.length > 0 && (
                   <div className="mt-8 pt-6 border-t border-slate-200">
                     <DocumentUploader 
                       bidderId={JSON.parse(localStorage.getItem('user') || '{}').id} 
                       allowedDocTypes={missingDocs}
                       onUploadComplete={fetchApp}
                     />
                   </div>
                 )}
               </>
             );
          })()}
        </div>
      </div>
    </div>
  );
}
