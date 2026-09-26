import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Users, Search, AlertCircle, Settings, CheckCircle2, Check, X, XCircle } from "lucide-react";
import { toast, Toaster } from 'sonner';

export default function OfficerTenderDetailPage() {
  const { tenderId } = useParams();
  const navigate = useNavigate();
  const handleCancelTender = async () => {
    if (!window.confirm("Are you sure you want to cancel this tender? This will halt all applications.")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/tenders/${tenderId}/cancel`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to cancel tender");
      toast.success("Tender cancelled successfully");
      fetchTenderData();
    } catch (err) {
      toast.error("Error cancelling tender");
    }
  };
  const [tender, setTender] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenderData = () => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/tenders/${tenderId}`).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/tenders/${tenderId}/applications`).then(r => r.json())
    ]).then(([tenderData, appsData]) => {
      setTender(tenderData);
      setApplications(appsData);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchTenderData();
  }, [tenderId]);

  const handleEvaluate = async (appId: string) => {
    const userStr = localStorage.getItem('user');
    const officerId = userStr ? JSON.parse(userStr).id : "";
    
    const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/bids/${appId}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ officerId })
    });
    
    if (res.ok) {
      navigate(`/officer/bids/${appId}/scorecard`);
    } else {
      alert("Failed to start evaluation");
    }
  };

  const handleAccess = async (appId: string, action: 'grant' | 'deny') => {
    const userStr = localStorage.getItem('user');
    const officerId = userStr ? JSON.parse(userStr).id : "";
    
    const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/bids/${appId}/${action}-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ officerId })
    });
    
    if (res.ok) {
      toast.success(`Access ${action}ed successfully.`);
      fetchTenderData(); // Refresh list
    } else {
      toast.error(`Failed to ${action} access.`);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading tender details...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      <Toaster position="bottom-right" />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">{tender.title}</h1>
            <div className="flex gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1"><FileText size={16}/> {tender.category}</span>
              <span className="flex items-center gap-1"><Users size={16}/> {tender.organization}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold uppercase">{tender.status}</span>
              {tender.access_type === 'private' && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold uppercase">PRIVATE</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tender.status !== 'closed' && (
               <button 
                 onClick={handleCancelTender}
                 className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded transition"
               >
                 <XCircle size={18} /> Cancel Tender
               </button>
            )}
            <button 
              onClick={() => navigate(`/officer/rules?tenderId=${tender.id}`)}
              className="flex items-center gap-2 text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded transition"
            >
              <Settings size={18} /> Manage Rules
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
           <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Estimated Contract Value</h3>
           <div className="text-2xl font-bold text-slate-800">
             {tender.est_value ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(tender.est_value) : 'N/A'}
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
           <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Closing Window</h3>
           <div className="text-2xl font-bold text-slate-800">
             {tender.closing_date ? new Date(tender.closing_date).toLocaleDateString('en-GB') : 'N/A'}
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
           <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Applications</h3>
           <div className="text-2xl font-bold text-slate-800">
             {applications.length}
           </div>
           <div className="text-xs text-slate-500 mt-1">Bids registered in vault</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Bid Applications Queue</h2>
        </div>
        
        {applications.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No applications received yet.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Application ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submitted Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app: any) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium font-mono text-xs">{app.id.substring(0,8)}...</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{app.bidderName || 'Unknown Vendor'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      app.status === 'submitted' ? 'bg-amber-100 text-amber-700' :
                      app.status === 'under_evaluation' ? 'bg-blue-100 text-blue-700' :
                      app.status === 'qualified' ? 'bg-green-100 text-green-700' :
                      app.status === 'clarification_requested' ? 'bg-purple-100 text-purple-700' :
                      app.status === 'access_pending' ? 'bg-orange-100 text-orange-700' :
                      app.status === 'access_denied' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {app.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {app.status === 'draft' ? (
                      <span className="text-slate-400">Not Submitted</span>
                    ) : app.status === 'access_denied' ? (
                      <span className="text-red-500">Access Denied</span>
                    ) : app.status === 'access_pending' ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleAccess(app.id, 'grant')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded flex items-center gap-1 transition">
                          <Check size={14} /> Grant
                        </button>
                        <button onClick={() => handleAccess(app.id, 'deny')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded flex items-center gap-1 transition">
                          <X size={14} /> Deny
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleEvaluate(app.id)}
                        className="text-blue-600 font-medium hover:underline flex items-center justify-end gap-1 w-full"
                      >
                        {['qualified', 'disqualified'].includes(app.status) ? 'View Scorecard' : 'Evaluate'} 
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
