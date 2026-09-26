import { useState, useEffect } from 'react';
import { Settings, Save, ArrowLeft, FileText } from "lucide-react";
import { toast, Toaster } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function RulesConfigPage() {
  const [searchParams] = useSearchParams();
  const tenderId = searchParams.get('tenderId');
  const navigate = useNavigate();
  
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tender, setTender] = useState<any>(null);

  // Available rules catalog
  const catalog = [
    { type: 'gst_active_and_filed', label: 'GST Active & Returns Filed', category: 'Statutory', requiresThreshold: false },
    { type: 'pan_valid', label: 'PAN Valid', category: 'Statutory', requiresThreshold: false },
    { type: 'udyam_valid', label: 'Udyam Registration Valid', category: 'Statutory', requiresThreshold: false },
    { type: 'not_debarred', label: 'Not on Debarment List', category: 'Statutory', requiresThreshold: false },
    { type: 'epfo_esic_compliance', label: 'EPFO/ESIC Compliant', category: 'Statutory', requiresThreshold: false },
    { type: 'mse_exemption', label: 'MSE Exemption Applicable', category: 'Policy', requiresThreshold: false },
    { type: 'local_content_pct', label: 'Minimum Local Content (%)', category: 'Policy', requiresThreshold: true },
    { type: 'turnover_threshold_inr', label: 'Minimum Turnover (INR)', category: 'Financial', requiresThreshold: true },
  ];

  const [accessType, setAccessType] = useState('public');
  const [privatePassword, setPrivatePassword] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [estValue, setEstValue] = useState('');

  useEffect(() => {
    if (!tenderId) return;

    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/tenders/${tenderId}`)
      .then(res => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(data => {
        setTender(data);
        setAccessType(data.access_type || 'public');
        setPrivatePassword(data.private_password || '');
        if (data.closing_date) {
            setClosingDate(new Date(data.closing_date).toISOString().slice(0, 16));
        }
        setEstValue(data.est_value ? data.est_value.toString() : '');
        const savedRules = data.rules || [];
        if (data.rules) {
          const fetchedCustom = data.rules
            .filter((r: any) => r.clauseType.startsWith('custom_'))
            .map((r: any) => ({ name: r.clauseType.replace('custom_', '').replace(/_/g, ' ') }));
          setCustomDocs(fetchedCustom);
        }
        const stateRules = catalog.map(c => {
          const saved = savedRules.find((sr: any) => sr.clauseType === c.type);
          return {
            ...c,
            enabled: !!saved,
            threshold_value: saved ? saved.threshold : '',
            mandatory: saved ? saved.mandatory : true
          };
        });
        setRules(stateRules);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Tender not found");
        setLoading(false);
      });
  }, [tenderId]);

  const handleToggle = (type: string) => {
    setRules(rules.map(r => r.type === type ? { ...r, enabled: !r.enabled } : r));
  };

  const handleThresholdChange = (type: string, value: string) => {
    setRules(rules.map(r => r.type === type ? { ...r, threshold_value: value } : r));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const invalid = rules.find(r => r.enabled && r.requiresThreshold && !r.threshold_value);
    if (invalid) {
      toast.error(`Please provide a threshold value for ${invalid.label}`);
      setIsSaving(false);
      return;
    }

    const payload = {
      rules: [
        ...rules.filter(r => r.enabled).map(r => ({
          clauseType: r.type,
          thresholdValue: r.requiresThreshold ? parseFloat(r.threshold_value) : null,
          mandatory: r.mandatory
        })),
        ...customDocs.map(cd => ({
          clauseType: `custom_${cd.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          thresholdValue: null,
          mandatory: true
        }))
      ]
    };

    try {
      // 1. Update access_type, password, closing date and estimated value together
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/tenders/${tenderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_type: accessType,
          private_password: accessType === 'private' ? privatePassword : null,
          closing_date: closingDate || null,
          est_value: estValue ? parseFloat(estValue) : null,
        })
      });

      // 2. Save Rules
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/tenders/${tenderId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save rules");
      
      // Mark tender as open if not already (auto publish after rules are set)
      if (tender.status === 'draft') {
          await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/tenders/${tenderId}/publish`, { method: 'POST' });
      }
      
      toast.success("Rule configuration saved & Tender Published!");
      setTimeout(() => navigate(`/officer/tenders/${tenderId}`), 1000);
    } catch (err) {
      toast.error("Failed to save rules");
    } finally {
      setIsSaving(false);
    }
  };

  if (!tenderId) return <div className="p-8 text-center">No tender selected.</div>;
  if (loading) return <div className="flex h-full items-center justify-center">Loading configuration...</div>;

  const categories = Array.from(new Set(rules.map(r => r.category)));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <Toaster position="bottom-right" />
      
      <button onClick={() => navigate(`/officer/tenders/${tenderId}`)} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
        <ArrowLeft size={16}/> Back to Tender
      </button>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tender Rule Configuration</h1>
          <p className="text-slate-500 text-sm mt-1">Configure eligibility clauses for: <strong>{tender?.title}</strong></p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 shadow"
        >
          {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          Save & Publish
        </button>
      </header>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="bg-slate-50 p-4 font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200">
          <Settings className="w-4 h-4 text-slate-400" />
          Access Control
        </div>
        <div className="p-4 flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="access_type" 
              value="public" 
              checked={accessType === 'public'} 
              onChange={() => setAccessType('public')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700">Public (Open Marketplace)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="access_type" 
              value="private" 
              checked={accessType === 'private'} 
              onChange={() => setAccessType('private')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700">Private (Requires Access Password)</span>
          </label>
        </div>
        
        {accessType === 'private' && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Access Password:</label>
            <input 
              type="text" 
              placeholder="Leave blank to keep existing, or enter new password"
              value={privatePassword}
              onChange={(e) => setPrivatePassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              className="w-full max-w-md border-slate-300 rounded text-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Settings className="text-blue-600" size={20} /> Edit Tender Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Closing Date</label>
             <input 
               type="datetime-local" 
               value={closingDate}
               onChange={(e) => setClosingDate(e.target.value)}
               className="w-full border-slate-300 rounded text-sm p-2.5 border focus:ring-blue-500 focus:border-blue-500"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Value (₹)</label>
             <input 
               type="number" 
               placeholder="e.g. 50000000"
               value={estValue}
               onChange={(e) => setEstValue(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
               className="w-full border-slate-300 rounded text-sm p-2.5 border focus:ring-blue-500 focus:border-blue-500"
             />
           </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="text-blue-600" size={20} /> Custom Required Documents
        </h2>
        <p className="text-sm text-slate-500 mb-4">Add specific documents you need vendors to upload (e.g., "Financial Statement 2023"). These will bypass AI checks and go straight to your Manual Review queue.</p>
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="Document Name" 
            value={newCustomDoc}
            onChange={(e) => setNewCustomDoc(e.target.value)}
            className="flex-1 border-slate-300 rounded text-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (newCustomDoc.trim()) {
                  setCustomDocs([...customDocs, {name: newCustomDoc.trim()}]);
                  setNewCustomDoc('');
                }
              }
            }}
          />
          <button 
            type="button"
            onClick={() => {
              if (newCustomDoc.trim()) {
                setCustomDocs([...customDocs, {name: newCustomDoc.trim()}]);
                setNewCustomDoc('');
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition"
          >
            Add
          </button>
        </div>
        <div className="space-y-2">
          {customDocs.map((cd, idx) => (
            <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-100">
              <span className="font-medium text-slate-700 capitalize">{cd.name}</span>
              <button 
                type="button"
                onClick={() => setCustomDocs(customDocs.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-700 font-medium text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          {customDocs.length === 0 && <div className="text-sm text-slate-400 italic">No custom documents required.</div>}
        </div>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {categories.map((cat, idx) => (
          <div key={cat} className="border-b border-slate-200 last:border-0">
            <div className="bg-slate-50 p-4 font-semibold text-slate-700 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" />
              {cat} Requirements
            </div>
            <div className="divide-y divide-slate-100">
              {rules.filter(r => r.category === cat).map(rule => (
                <div key={rule.type} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <input 
                      type="checkbox" 
                      checked={rule.enabled} 
                      onChange={() => handleToggle(rule.type)}
                      className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-medium text-slate-900">{rule.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Automated engine verification</div>
                    </div>
                  </div>
                  
                  {rule.requiresThreshold && (
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-slate-600">Threshold:</label>
                      <input 
                        type="number"
                        disabled={!rule.enabled}
                        value={rule.threshold_value}
                        onChange={(e) => handleThresholdChange(rule.type, e.target.value)}
                        placeholder="e.g. 35"
                        className="w-32 border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:opacity-50"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
