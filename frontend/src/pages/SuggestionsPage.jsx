import { useState, useEffect } from 'react';
import { api } from '../api';

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [toast, setToast]             = useState(null);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const load = async () => {
    const data = await api.suggestions.list();
    setSuggestions(data);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await api.suggestions.submit({ title, description });
      setTitle(''); setDescription(''); setShowForm(false);
      showToast('Suggestion submitted! 🎉');
      await load();
    } catch (err) { showToast(err.message, 'error'); }
    setSubmitting(false);
  };

  const toggleVote = async (s) => {
    try {
      if (s.voted) {
        await api.suggestions.unvote(s.id);
      } else {
        await api.suggestions.vote(s.id);
      }
      await load();
    } catch {}
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, paddingBottom:32, position:'relative' }}>

      {toast && (
        <div style={{
          position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', zIndex:200,
          background: toast.type==='error' ? '#7f1d1d' : '#064e3b',
          border:`1px solid ${toast.type==='error' ? '#ef444455':'#10b98155'}`,
          color: toast.type==='error' ? '#fca5a5':'#6ee7b7',
          padding:'10px 20px', borderRadius:10, fontWeight:500, fontSize:14,
          whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(0,0,0,0.5)'
        }} className="animate-fade">{toast.msg}</div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontFamily:'Cinzel,serif', fontSize:20, marginBottom:4 }}>Feature Suggestions</h2>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>Vote on ideas or submit your own. Most voted features get built first.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancel' : '+ Suggest'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card animate-fade" style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
          <h3 style={{ fontFamily:'Cinzel,serif', fontSize:15 }}>New Suggestion</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={S.label}>Title</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Dark mode, Monthly challenges..."
              style={S.input} maxLength={200} required autoFocus
            />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={S.label}>Description <span style={{ color:'var(--text-muted)', fontWeight:400 }}>(optional)</span></label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Any extra details about your idea..."
              style={{ ...S.input, height:80, resize:'vertical' }}
              maxLength={500}
            />
          </div>
          <button className="btn btn-gold" type="submit" disabled={submitting || !title.trim()}>
            {submitting ? 'Submitting...' : '🚀 Submit Suggestion'}
          </button>
        </form>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {suggestions.length === 0 && (
          <div style={S.empty}>
            <div style={{ fontSize:48, marginBottom:12 }}>💡</div>
            <p style={{ color:'var(--text-muted)' }}>No suggestions yet — be the first!</p>
          </div>
        )}
        {suggestions.map((s, i) => (
          <div key={s.id} className="card" style={{ padding:'14px 16px', display:'flex', gap:14, alignItems:'flex-start' }}>
            {/* Rank */}
            <div style={{ fontSize:13, color:'var(--text-muted)', width:20, textAlign:'center', paddingTop:2, flexShrink:0 }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
            </div>

            {/* Vote button */}
            <button
              onClick={() => toggleVote(s)}
              style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                background: s.voted ? 'rgba(99,102,241,0.15)' : 'var(--bg3)',
                border:`1px solid ${s.voted ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius:8, padding:'6px 10px', cursor:'pointer', flexShrink:0,
                color: s.voted ? 'var(--accent2)' : 'var(--text-muted)', minWidth:44
              }}
            >
              <span style={{ fontSize:16 }}>{s.voted ? '▲' : '△'}</span>
              <span style={{ fontSize:13, fontWeight:700 }}>{s.votes}</span>
            </button>

            {/* Content */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:15, marginBottom:4 }}>{s.title}</div>
              {s.description && <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:6 }}>{s.description}</p>}
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                by {s.username || 'Anonymous'} · {new Date(s.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const S = {
  label: { fontSize:12, color:'var(--text-muted)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.04em' },
  input: { background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', color:'var(--text)', fontSize:14, outline:'none', width:'100%' },
  empty: { textAlign:'center', padding:'48px 24px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12 }
};
