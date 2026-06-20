import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Plus, User, X, Upload, Loader2, CheckCircle2, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import 'react-phone-number-input/style.css';
import PhoneInput, { getCountries } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en.json';

const getFlagEmoji = (countryCode) => countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));

const COUNTRY_OPTIONS = getCountries().map(code => ({
  value: code,
  label: `${getFlagEmoji(code)} ${en[code]}`
}));
import SEO from '../components/SEO';

// ─── Input components defined OUTSIDE modal to prevent re-render focus loss ──
const InputField = ({ label, value, onChange, type = 'text', required = true, placeholder = '' }) => (
  <div className="flex flex-col space-y-1">
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
      {label} {required && <span className="text-primary">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-black/40 border border-gray-800 focus:border-primary rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
    />
  </div>
);

const SelectField = ({ label, value, onChange, options, required = true, placeholder = 'Select...' }) => (
  <div className="flex flex-col space-y-1">
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
      {label} {required && <span className="text-primary">*</span>}
    </label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-black/40 border border-gray-800 focus:border-primary rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors appearance-none"
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(o => {
        const val = typeof o === 'string' ? o : o.value;
        const lbl = typeof o === 'string' ? o : o.label;
        return <option key={val} value={val}>{lbl}</option>;
      })}
    </select>
  </div>
);

const PhotoUpload = ({ label, preview, onChange, required = false }) => {
  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert(`${label}: File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 2MB allowed. Please compress or resize the image.`);
      return;
    }
    onChange(file);
  };
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <label className="relative cursor-pointer group">
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        {preview ? (
          <div className="relative h-32 rounded-xl overflow-hidden border border-primary/50">
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </div>
        ) : (
          <div className="h-32 rounded-xl border-2 border-dashed border-gray-700 group-hover:border-primary transition-colors flex flex-col items-center justify-center space-y-2">
            <Upload className="w-6 h-6 text-gray-600 group-hover:text-primary transition-colors" />
            <span className="text-xs text-gray-600 group-hover:text-gray-400">Click to upload</span>
            <span className="text-[9px] text-gray-700">Max 2MB · JPG, PNG, WebP</span>
          </div>
        )}
      </label>
    </div>
  );
};

const WEIGHT_CLASSES = [
  'Strawweight (52kg)', 'Flyweight (57kg)', 'Bantamweight (61kg)',
  'Featherweight (66kg)', 'Lightweight (70kg)', 'Welterweight (77kg)',
  'Middleweight (84kg)', 'Light Heavyweight (93kg)', 'Heavyweight (120kg)',
];

// ─── Become a Champion Modal ─────────────────────────────────────────────────
const BecomeChampionModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', nickname: '', phone: '', email: '',
    dateOfBirth: '', country: '', countryCode: '', height: '', weight: '', association: '',
    classSpeciality: '', wins: '', koTko: '', decisions: '', losses: '',
    submissions: '', organisation: '', tapologyLink: '', sherdogLink: '',
    tfcLink: '', facebookLink: '', instagramLink: '', youtubeLink: '',
  });

  const [photos, setPhotos] = useState({ profilePicture: null, fightPicture: null, trainingPicture: null });
  const [previews, setPreviews] = useState({ profilePicture: null, fightPicture: null, trainingPicture: null });

  // Stable updater — won't cause child re-renders
  const update = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);

  const handlePhoto = useCallback((key, file) => {
    if (!file) return;
    setPhotos(p => ({ ...p, [key]: file }));
    const reader = new FileReader();
    reader.onload = (e) => setPreviews(p => ({ ...p, [key]: e.target.result }));
    reader.readAsDataURL(file);
  }, []);

  const validateStep = (s) => {
    if (s === 1) {
      const required = ['firstName','lastName','nickname','phone','email','dateOfBirth','country','height','weight','association','classSpeciality'];
      const missing = required.filter(k => !form[k] || String(form[k]).trim() === '');
      if (missing.length > 0) { setError(`Please fill in all required fields: ${missing.map(k => k.replace(/([A-Z])/g,' $1')).join(', ')}`); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Please enter a valid email address.'); return false; }
    }
    if (s === 2) {
      const required = ['wins','decisions','losses','submissions','organisation'];
      const missing = required.filter(k => !form[k] && form[k] !== 0 && String(form[k]).trim() === '');
      if (missing.length > 0) { setError(`Please fill in: ${missing.map(k => k.replace(/([A-Z])/g,' $1')).join(', ')}`); return false; }
    }
    if (s === 3) {
      if (!photos.profilePicture) { setError('Profile photo is required.'); return false; }
    }
    setError('');
    return true;
  };

  const goNext = () => {
    if (validateStep(step)) setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photos.profilePicture) fd.append('profilePicture', photos.profilePicture);

      const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backend}/api/champions/apply`, { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) setSuccess(true);
      else setError(data.error || 'Submission failed. Please try again.');
    } catch {
      setError('Connection error. Please make sure the server is running.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#0a0a0a] border border-gray-800 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
      >
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-gray-800 p-8 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Become a Champion</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors"><X /></button>
        </div>

        <div className="px-8 pt-4">
          <div className="h-1 bg-gray-800 rounded-full">
            <motion.div animate={{ width: `${(step / 3) * 100}%` }} className="h-full bg-primary rounded-full" />
          </div>
          <div className="flex justify-between mt-2">
            {['Personal Info', 'Fight Stats', 'Links & Photos'].map((s, i) => (
              <span key={s} className={`text-[9px] font-black uppercase tracking-widest ${step > i ? 'text-primary' : 'text-gray-600'}`}>{s}</span>
            ))}
          </div>
        </div>

        <div className="p-8">
          {success ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-6" />
              <h3 className="text-2xl font-black uppercase mb-4">Application Submitted!</h3>
              <p className="text-gray-400 leading-relaxed">Your profile has been submitted for review. We'll contact you at your email once approved.</p>
              <button onClick={onClose} className="mt-8 bg-primary hover:bg-red-600 text-black font-black py-4 px-10 rounded-2xl uppercase tracking-widest transition-all">Close</button>
            </motion.div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="First Name" value={form.firstName} onChange={v => update('firstName', v)} />
                    <InputField label="Last Name" value={form.lastName} onChange={v => update('lastName', v)} />
                  </div>
                  <InputField label="Nickname / Fighter Name" value={form.nickname} onChange={v => update('nickname', v)} placeholder="e.g. The Lion" />
                  <div className="grid grid-cols-2 gap-4">
                    <SelectField 
                      label="Country" 
                      value={form.countryCode} 
                      onChange={code => {
                        update('countryCode', code);
                        update('country', en[code]);
                      }} 
                      options={COUNTRY_OPTIONS} 
                      placeholder="Select Country" 
                    />
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        Phone Number <span className="text-primary">*</span>
                      </label>
                      <PhoneInput
                        international
                        defaultCountry="US"
                        country={form.countryCode || undefined}
                        value={form.phone}
                        onChange={v => update('phone', v)}
                        className="bg-black/40 border border-gray-800 focus-within:border-primary rounded-xl px-4 py-3 text-sm text-white transition-colors [&>input]:bg-transparent [&>input]:outline-none [&>input]:text-white [&>input]:w-full [&>.PhoneInputCountry]:mr-3"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Date of Birth" value={form.dateOfBirth} onChange={v => update('dateOfBirth', v)} type="date" />
                    <InputField label="Email" value={form.email} onChange={v => update('email', v)} type="email" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Height (m)" value={form.height} onChange={v => update('height', v)} type="number" placeholder="e.g. 1.78" />
                    <InputField label="Weight (kg)" value={form.weight} onChange={v => update('weight', v)} type="number" placeholder="e.g. 77" />
                  </div>
                  <InputField label="Association / Gym" value={form.association} onChange={v => update('association', v)} placeholder="e.g. Team Alpha" />
                  <SelectField label="Weight Class" value={form.classSpeciality} onChange={v => update('classSpeciality', v)} options={WEIGHT_CLASSES} />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
                    <p className="text-xs text-gray-400">Enter your professional fight record below.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Total Wins" value={form.wins} onChange={v => update('wins', v)} type="number" placeholder="0" />
                    <InputField label="Total Losses" value={form.losses} onChange={v => update('losses', v)} type="number" placeholder="0" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <InputField label="KO / TKO" value={form.koTko} onChange={v => update('koTko', v)} type="number" placeholder="0" required={false} />
                    <InputField label="Decisions" value={form.decisions} onChange={v => update('decisions', v)} type="number" placeholder="0" />
                    <InputField label="Submissions" value={form.submissions} onChange={v => update('submissions', v)} type="number" placeholder="0" />
                  </div>
                  <InputField label="Organisation" value={form.organisation} onChange={v => update('organisation', v)} placeholder="e.g. TFC, UFC, Bellator" />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Fighter Profiles <span className="text-gray-600 normal-case font-normal">(optional)</span></p>
                    <div className="space-y-4">
                      <InputField label="Tapology Link" value={form.tapologyLink} onChange={v => update('tapologyLink', v)} placeholder="https://tapology.com/..." required={false} />
                      <InputField label="Sherdog Link" value={form.sherdogLink} onChange={v => update('sherdogLink', v)} placeholder="https://sherdog.com/..." required={false} />
                      <InputField label="TFC Profile Link" value={form.tfcLink} onChange={v => update('tfcLink', v)} placeholder="https://tfc-event.com/..." required={false} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Social Media (Optional)</p>
                    <div className="space-y-4">
                      <InputField label="Facebook" value={form.facebookLink} onChange={v => update('facebookLink', v)} required={false} placeholder="https://facebook.com/..." />
                      <InputField label="Instagram" value={form.instagramLink} onChange={v => update('instagramLink', v)} required={false} placeholder="https://instagram.com/..." />
                      <InputField label="YouTube" value={form.youtubeLink} onChange={v => update('youtubeLink', v)} required={false} placeholder="https://youtube.com/..." />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Photo</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <PhotoUpload label="Profile Photo" preview={previews.profilePicture} onChange={f => handlePhoto('profilePicture', f)} required />
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

              <div className="flex justify-between mt-8">
                {step > 1 ? (
                  <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 rounded-xl font-bold uppercase text-xs tracking-widest transition-all">Back</button>
                ) : <div />}
                {step < 3 ? (
                  <button onClick={goNext} className="bg-primary hover:bg-red-600 text-black font-black py-3 px-8 rounded-xl uppercase tracking-widest transition-all">Next</button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-red-600 disabled:opacity-60 text-black font-black py-3 px-8 rounded-xl uppercase tracking-widest transition-all flex items-center space-x-2">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Submitting...</span></> : <span>Submit Application</span>}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Champions Page ──────────────────────────────────────────────────────
const Champions = () => {
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sortField, setSortField] = useState('wins');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    fetch(`${backend}/api/champions`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setChampions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [showModal]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sorted = [...champions].sort((a, b) => {
    let aVal, bVal;
    if (sortField === 'wins') { aVal = a.record?.wins || 0; bVal = b.record?.wins || 0; }
    else if (sortField === 'height') { aVal = a.height || 0; bVal = b.height || 0; }
    else if (sortField === 'weight') { aVal = a.weight || 0; bVal = b.weight || 0; }
    else { aVal = a[sortField] || ''; bVal = b[sortField] || ''; }
    return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const SortBtn = ({ field, label }) => (
    <button onClick={() => handleSort(field)} className="flex items-center space-x-1 hover:text-white transition-colors">
      <span>{label}</span>
      {sortField === field && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
    </button>
  );

  return (
    <div className="p-4 sm:p-8 md:p-16 max-w-7xl mx-auto min-h-screen">
      <SEO title="Champions" description="TFC Fighter Rankings and Champion Profiles." />

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4 sm:gap-6">
        <div>
          <h2 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-2 sm:mb-4">
            TFC <span className="text-primary italic">Champions</span>
          </h2>
          <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] sm:text-xs">Fighter Rankings & Profiles</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 sm:space-x-3 bg-primary hover:bg-red-600 text-black font-black py-3 sm:py-4 px-5 sm:px-8 rounded-2xl uppercase tracking-widest text-sm sm:text-base transition-all shadow-xl shadow-primary/20">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" /><span>Become a Champion</span>
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : champions.length === 0 ? (
        <div className="text-center py-24 bg-surface border border-gray-800 rounded-3xl">
          <Trophy className="w-16 h-16 text-primary/30 mx-auto mb-6" />
          <h3 className="text-2xl font-black uppercase mb-4">No Champions Yet</h3>
          <p className="text-gray-500 mb-8">Be the first to submit your fighter profile.</p>
          <button onClick={() => setShowModal(true)} className="bg-primary hover:bg-red-600 text-black font-black py-4 px-8 rounded-2xl uppercase tracking-widest transition-all">Apply Now</button>
        </div>
      ) : (
        <div className="bg-surface border border-gray-800 rounded-3xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 w-12">#</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Fighter</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Nickname</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-500"><SortBtn field="height" label="Height" /></th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-500"><SortBtn field="weight" label="Weight" /></th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Association</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-500"><SortBtn field="wins" label="Record" /></th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Links</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="border-b border-gray-800/50 hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <span className={`font-black text-sm ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-600'}`}>{i + 1}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        {c.images?.profile ? (
                          <img src={c.images.profile} alt={c.fullName} className="w-10 h-10 rounded-full object-cover border-2 border-gray-700 group-hover:border-primary transition-colors" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border-2 border-gray-700">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-black text-sm text-white">{c.fullName}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{c.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><span className="text-primary font-bold text-sm italic">"{c.nickname}"</span></td>
                    <td className="p-4"><span className="text-white font-bold text-sm">{c.height}m</span></td>
                    <td className="p-4">
                      <div>
                        <span className="text-white font-bold text-sm">{c.weight}kg</span>
                        <p className="text-[9px] text-gray-500 mt-0.5 truncate max-w-[100px]">{c.classSpeciality?.split(' ')[0]}</p>
                      </div>
                    </td>
                    <td className="p-4"><span className="text-gray-300 text-sm">{c.association}</span></td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1 text-xs font-black">
                        <span className="text-green-400">{c.record?.wins}W</span>
                        <span className="text-gray-600">-</span>
                        <span className="text-red-400">{c.record?.losses}L</span>
                        {c.record?.koTko > 0 && <span className="text-primary ml-1">({c.record.koTko} KO)</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        {c.links?.tapology && <a href={c.links.tapology} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors"><ExternalLink className="w-4 h-4" /></a>}
                        {c.links?.instagram && <a href={c.links.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-400 transition-colors"><ExternalLink className="w-4 h-4" /></a>}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-800/50">
            {sorted.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <span className={`font-black text-lg w-8 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-600'}`}>{i + 1}</span>
                  {c.images?.profile ? (
                    <img src={c.images.profile} alt={c.fullName} className="w-12 h-12 rounded-full object-cover border-2 border-gray-700" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border-2 border-gray-700">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-white truncate">{c.fullName}</p>
                    <p className="text-primary font-bold text-xs italic truncate">"{c.nickname}"</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{c.country}</p>
                  </div>
                  <div className="flex items-center space-x-1 text-sm font-black flex-shrink-0">
                    <span className="text-green-400">{c.record?.wins}W</span>
                    <span className="text-gray-600">-</span>
                    <span className="text-red-400">{c.record?.losses}L</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 pl-11">
                  <span>{c.height}m · {c.weight}kg</span>
                  <span className="truncate ml-2">{c.association}</span>
                  <div className="flex space-x-2 flex-shrink-0 ml-2">
                    {c.links?.tapology && <a href={c.links.tapology} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary"><ExternalLink className="w-3.5 h-3.5" /></a>}
                    {c.links?.instagram && <a href={c.links.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-400"><ExternalLink className="w-3.5 h-3.5" /></a>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && <BecomeChampionModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Champions;
