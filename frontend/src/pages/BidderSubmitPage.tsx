import { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, ShieldAlert, FileText, ChevronRight, AlertCircle, Loader2, X, Eye } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const SCAN_MESSAGES = [
  "Initializing AI Engine...",
  "Running OCR Extraction...",
  "Analyzing Document Layout...",
  "Cross-checking GeM Clauses...",
  "Validating Authenticity..."
];

function ScanningText() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % SCAN_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return <span className="animate-pulse">{SCAN_MESSAGES[msgIdx]}</span>;
}

export default function BidderSubmitPage() {
  const [docType, setDocType] = useState('pan');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [pendingConfirmId, setPendingConfirmId] = useState<string | null>(null);
  const [confirmFields, setConfirmFields] = useState<any>({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [isForcing, setIsForcing] = useState(false);
  const [manualReviewRequested, setManualReviewRequested] = useState(false);
  const [manualReviewMessage, setManualReviewMessage] = useState("");
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [duplicateConfirm, setDuplicateConfirm] = useState<{file: File, docType: string, isForcing: boolean} | null>(null);
  
  // DigiLocker State
  const [showDigilockerModal, setShowDigilockerModal] = useState(false);
  const [isDigilockerPulling, setIsDigilockerPulling] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};

  const fetchVault = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/bidders/${user.id}/documents`);
      const data = await res.json();
      setUploadedDocs(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVault();
  }, []);

  const handleUpload = async (e: React.FormEvent | null, forceManual = false, skipDuplicateCheck = false) => {
    if (e) e.preventDefault();
    
    const targetFile = duplicateConfirm ? duplicateConfirm.file : file;
    const targetDocType = duplicateConfirm ? duplicateConfirm.docType : docType;
    const targetForce = duplicateConfirm ? duplicateConfirm.isForcing : forceManual;
    
    if (!targetFile) return;

    // Duplicate Check
    if (!skipDuplicateCheck) {
        const existing = uploadedDocs.find(d => d.docType === targetDocType);
        if (existing) {
            setDuplicateConfirm({ file: targetFile, docType: targetDocType, isForcing: targetForce });
            return;
        }
    }

    if (targetForce) setIsForcing(true);
    else setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', targetFile);
    formData.append('docType', targetDocType);
    formData.append('bidderId', user.id);
    formData.append('force_manual', targetForce ? 'true' : 'false');
    formData.append('manual_review_requested', manualReviewRequested ? 'true' : 'false');
    formData.append('manual_review_message', manualReviewMessage);

    try {
      if (duplicateConfirm) {
          const existing = uploadedDocs.find(d => d.docType === targetDocType);
          if (existing) {
              await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/documents/${existing.id}?bidderId=${user.id}`, {
                  method: 'DELETE'
              });
          }
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/documents/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) { 
          const errData = await res.json().catch(() => ({})); 
          if (errData.detail && errData.detail.error === 'OCR_REJECTED') {
              setFailCount(prev => prev + 1);
              throw new Error(errData.detail.message);
          }
          throw new Error(errData.detail || "Upload failed"); 
      }
      
      const data = await res.json();
      
      if (targetForce) {
          toast.success("Document submitted for Manual Review!");
      } else {
          toast.success("Document verified and added to Vault!");
      }
      
      setFile(null);
      setFailCount(0);
      setDuplicateConfirm(null);
      await fetchVault();
      
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      setIsForcing(false);
    }
  };

  const submitConfirmation = async () => {
    if (!pendingConfirmId) return;
    setIsConfirming(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/documents/${pendingConfirmId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidderId: user.id, confirmed_fields: confirmFields })
      });
      if (!res.ok) throw new Error("Failed to confirm fields");
      toast.success("Fields confirmed successfully.");
      setPendingConfirmId(null);
      await fetchVault();
    } catch(err) {
      toast.error("Confirmation failed");
    } finally {
      setIsConfirming(false);
    }
  };


  const handleDigilockerPull = async () => {
    setIsDigilockerPulling(true);
    try {
      // 1. Initiate
      const initRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/documents/digilocker/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidderId: user.id, docType })
      });
      if (!initRes.ok) throw new Error("Failed to initiate DigiLocker connection");
      const initData = await initRes.json();
      
      // 2. Pull
      const pullRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/documents/digilocker/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidderId: user.id, requestId: initData.requestId })
      });
      if (!pullRes.ok) throw new Error("Failed to pull document from DigiLocker");
      
      toast.success("Document successfully pulled from DigiLocker!");
      setShowDigilockerModal(false);
      await fetchVault();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "DigiLocker pull failed.");
    } finally {
      setIsDigilockerPulling(false);
    }
  };

  const calculatePreScore = () => {
    if (uploadedDocs.length === 0) return 0;
    const verified = uploadedDocs.filter(d => d.ocrStatus === 'done').length;
    return Math.min(100, verified * 25);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 p-4">
      <Toaster position="bottom-right" />

            {/* DigiLocker Modal */}
      {showDigilockerModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative border-t-4 border-[#005a9e]">
            <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <img src="https://cdnbbsr.s3waas.gov.in/s3621bf66ddb7c962aa0d22ac97d69b793/uploads/2022/07/2022070183.png" alt="DigiLocker" className="h-6" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              DigiLocker
            </h3>
            <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded-md mb-4 border border-amber-200">
              Demo Mode — Partner Integration Pending
            </span>
            
            <p className="text-slate-600 mb-6 text-sm">
              You are about to authorize <strong>GemOne</strong> to access your <strong>{docType.replace('_', ' ').toUpperCase()}</strong> from your DigiLocker account.
            </p>
            
            <div className="bg-slate-50 p-4 rounded-lg mb-6 text-xs text-slate-500 border border-slate-200">
              <p className="mb-2"><strong>Data to be shared:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Document Issuer Name</li>
                <li>Digital Signature Validity</li>
                <li>Document Data Payload</li>
              </ul>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDigilockerModal(false)}
                disabled={isDigilockerPulling}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded"
              >
                Deny
              </button>
              <button 
                onClick={handleDigilockerPull}
                disabled={isDigilockerPulling}
                className="bg-[#005a9e] text-white px-4 py-2 rounded font-medium hover:bg-[#004780] flex items-center gap-2"
              >
                {isDigilockerPulling && <Loader2 className="animate-spin w-4 h-4"/>}
                Allow & Pull Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Confirmation Modal */}
      {duplicateConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Replace Existing Document?</h3>
            <p className="text-slate-600 mb-6 text-sm">
              You already have a <strong>{duplicateConfirm.docType.replace('_', ' ').toUpperCase()}</strong> in your vault. 
              Are you sure you want to replace it? The existing document will be archived.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDuplicateConfirm(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpload(null, duplicateConfirm.isForcing, true)}
                className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
              >
                Yes, Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 uppercase">
                {previewDoc.docType.replace('_', ' ')}
              </h3>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              <div className="flex-1 bg-slate-100 p-4 flex items-center justify-center overflow-auto">
                 {previewDoc.fileUrl ? (
                   previewDoc.fileUrl.toLowerCase().endsWith('.pdf') ? (
                     <iframe src={previewDoc.fileUrl} className="w-full h-[60vh] md:h-full border-0 rounded shadow-sm" />
                   ) : (
                     <img src={previewDoc.fileUrl} alt="Document" className="max-w-full max-h-[60vh] md:max-h-full object-contain rounded shadow-sm" />
                   )
                 ) : (
                   <div className="text-slate-400">No preview available</div>
                 )}
              </div>
              
              <div className="w-full md:w-80 border-l border-slate-200 p-6 bg-slate-50 overflow-y-auto">
                 <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                   <CheckCircle className="w-5 h-5 text-green-500" /> Extracted Credentials
                 </h4>
                 
                 {previewDoc.extractedFields && Object.keys(previewDoc.extractedFields).length > 0 ? (
                   <div className="space-y-4">
                     {Object.entries(previewDoc.extractedFields).map(([key, data]: [string, any]) => (
                       <div key={key} className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                         <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{key.replace('_', ' ')}</div>
                         <div className="font-medium text-slate-900">{typeof data === 'object' ? data.value : data}</div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-sm text-slate-500 italic">No fields extracted.</div>
                 )}
                 
                 <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">Status</div>
                    <div className="font-semibold capitalize text-slate-900">{previewDoc.ocrStatus}</div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      
      <header>
        <h1 className="text-2xl font-bold text-gray-900">My Document Vault</h1>
        <p className="text-gray-500 mt-1">Manage your centralized statutory documents. These will be attached to your bids.</p>
      </header>

      

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Upload New Document</h2>
          <form onSubmit={(e) => handleUpload(e, false)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
              <select 
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm p-2.5 border focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pan">PAN Card</option>
                <option value="gst_certificate">GST Registration</option>
                <option value="udyam_certificate">Udyam/MSME Certificate</option>
                <option value="epfo_esic">EPFO/ESIC Compliance</option>
                <option value="startup_india">Startup India (DIPP)</option>
                <option value="nsic_certificate">NSIC Certificate</option>
                <option value="oem_authorization">OEM Authorization</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">File (PDF or Image)</label>
              <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition relative overflow-hidden ${
                isUploading ? 'border-blue-400 bg-blue-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
              }`}>
                {!isUploading && (
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={isUploading} />
                )}

                {isUploading ? (
                  <div className="flex flex-col items-center justify-center space-y-4 py-2">
                    <div className="relative w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center border-2 border-blue-200 overflow-hidden shadow-inner">
                      <UploadCloud className="w-8 h-8 text-blue-600 relative z-10" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2 text-blue-700 font-semibold">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <ScanningText />
                      </div>
                      <p className="text-xs text-blue-600/80 mt-1">Applying AI OCR & validating against GeM guidelines...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600 justify-center">
                      <span className="relative font-medium text-blue-600">Upload a file or drag and drop</span>
                    </div>
                    <p className="text-xs text-slate-500">{file ? file.name : "PNG, JPG, PDF up to 10MB"}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                id="manualReviewReq" 
                checked={manualReviewRequested}
                onChange={(e) => setManualReviewRequested(e.target.checked)}
                className="rounded border-slate-300"
              />
              <label htmlFor="manualReviewReq" className="text-sm text-slate-700">This is an equivalent document (Request Manual Review)</label>
            </div>
            {manualReviewRequested && (
              <div className="mt-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Message for Officer</label>
                <textarea 
                  value={manualReviewMessage}
                  onChange={(e) => setManualReviewMessage(e.target.value)}
                  placeholder="Explain why this document is equivalent..."
                  className="w-full border-slate-300 rounded-md shadow-sm p-2.5 border focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>
            )}

            <div className="flex gap-2 w-full mt-4">
              <button
                type="submit"
                onClick={(e) => handleUpload(e, false)}
                disabled={isUploading || isForcing || !file}
                className="flex-1 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 gap-2"
              >
                {isUploading && <Loader2 className="animate-spin w-4 h-4"/>}
                {isUploading ? 'Running AI Scan...' : 'Secure Upload'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowDigilockerModal(true)}
                className="flex-1 flex justify-center items-center py-2.5 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 gap-2"
              >
                Fetch via DigiLocker
              </button>
            </div>
            
            {failCount >= 3 && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-amber-800 text-sm mb-3 font-medium flex items-center gap-2"><ShieldAlert size={16}/> You have failed automated verification 3 times.</p>
                    <button
                      type="button"
                      onClick={(e) => handleUpload(e, true)}
                      disabled={isForcing || !file}
                      className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 gap-2"
                    >
                      {isForcing && <Loader2 className="animate-spin w-4 h-4"/>}
                      Force Upload (Requires Manual Officer Review)
                    </button>
                </div>
            )}
          </form>
        </div>

        {/* Pre-Check Scorecard */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 w-full">
            <ShieldAlert className="w-5 h-5 text-green-500" /> Vault Readiness Score
          </h2>
          
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" 
                strokeDasharray={351.8} 
                strokeDashoffset={351.8 - (351.8 * calculatePreScore()) / 100}
                className="text-green-500 transition-all duration-1000 ease-out" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-3xl font-bold text-slate-900">{calculatePreScore()}</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">/ 100</span>
            </div>
          </div>
          
          <p className="mt-6 text-center text-sm text-slate-600 px-4">
            {calculatePreScore() === 100 
              ? "Your vault is complete. You are ready to apply for tenders."
              : "Upload all required verified documents to achieve a 100 readiness score."}
          </p>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">Secured Vault Documents</h2>
        {uploadedDocs.length === 0 ? (
           <div className="text-center p-6 text-slate-500 text-sm bg-slate-50 rounded">Your vault is empty.</div>
        ) : (
          <div className="space-y-3">
            {uploadedDocs.map((doc, i) => (
              <div key={i} onClick={() => setPreviewDoc(doc)} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white hover:shadow-md transition cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold uppercase flex items-center gap-2">
                        {doc.docType.replace('_', ' ')}
                        {doc.source === 'digilocker' && (
                            <span className="text-[10px] bg-[#e6f0fa] text-[#005a9e] border border-[#b3d4f5] px-1.5 py-0.5 rounded-full font-bold">
                                via DigiLocker
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-slate-500 flex gap-2 items-center mt-1">
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      {doc.ocrStatus === 'done' ? (
                        <span className="text-green-600 flex items-center gap-1 font-medium"><CheckCircle className="w-3 h-3"/> Verified</span>
                      ) : (
                        <span className="text-amber-600 flex items-center gap-1 font-medium"><ShieldAlert className="w-3 h-3"/> Needs Manual Review</span>
                      )}
                    </div>
                    {doc.manualReviewRequested && doc.manualReviewMessage && (
                      <div className="text-xs text-slate-600 mt-1 italic border-l-2 border-slate-300 pl-2">
                        "Request: {doc.manualReviewMessage}"
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-sm font-medium">
                    <Eye size={16} /> View
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
