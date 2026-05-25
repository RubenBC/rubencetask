import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { subscribeToPush, checkSubscription } from './lib/push';

// ─── ICONOS ──────────────────────────────────────────────────────────────────
const Ico = ({ d, s = 'w-5 h-5', col }) => (
  <svg className={s} viewBox="0 0 24 24" fill="none" stroke={col || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const IC = {
  search:  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  x:       'M6 18L18 6M6 6l12 12',
  plus:    'M12 4v16m8-8H4',
  bell:    'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  pin:     'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
  trash:   'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  archive: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
  note:    'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  tools:   'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  tag:     'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
  edit:    'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  swipe:   'M7 16l-4-4m0 0l4-4m-4 4h18',
  restore: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  chevron: 'M19 9l-7 7-7-7',
};

// ─── PALETA ──────────────────────────────────────────────────────────────────
const P = {
  gradA:'#92400E', gradB:'#D97706',
  primary:'#B45309', primaryDark:'#92400E',
  pCont:'#FFDEA8', onPCont:'#271900',
  secondary:'#6F5B40', secCont:'#FBE0BC',
  bg:'#FFFBF0', card:'#FFFFFF',
  surfHigh:'#F7EDD9',
  text:'#1F1B13', textMid:'#78716C', textLight:'#A8A29E',
  border:'#E8D5B0', borderLight:'#F0DDBC',
  error:'#BA1A1A', errCont:'#FFDAD6',
  success:'#1A6B4A', sucCont:'#DCFCE7',
};

// ─── NOTA COLORES ────────────────────────────────────────────────────────────
const NOTE_COLORS = ['#FFFFFF','#FFF3D6','#FCE4EC','#E1F5FE','#E8F5E9','#FFF8E1','#F3E5F5','#FBE9E7'];

// ─── TAG COLORS ──────────────────────────────────────────────────────────────
const TAG_COLORS = ['#B45309','#1B6584','#1A6B4A','#BA1A1A','#7C3AED','#0096C7','#D97706','#374151'];
const tagStyle = (color) => ({ bg: color + '22', text: color });

// ─── ACCIONES SWIPE ──────────────────────────────────────────────────────────
const SWIPE_OPS = {
  delete:  { label:'Eliminar',         icon:IC.trash,   bg:P.error,   text:'#fff', toast:'🗑️ Nota eliminada' },
  archive: { label:'Archivar',         icon:IC.archive, bg:P.success, text:'#fff', toast:'📦 Nota archivada' },
  pin:     { label:'Fijar / Desfijar', icon:IC.pin,     bg:P.primary, text:'#fff', toast:'📌 Nota fijada/desfijada' },
  none:    { label:'Ninguna',          icon:IC.x,       bg:P.textLight,text:'#fff',toast:null },
};

// ─── UTILS ───────────────────────────────────────────────────────────────────
const fmt  = d => new Date(d).toLocaleDateString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
const over = d => d && new Date(d) < new Date();
const uid  = () => Math.random().toString(36).slice(2);
const SWIPE_T = 72;

// ─── SWIPEABLE ───────────────────────────────────────────────────────────────
function Swipeable({ onLeft, onRight, leftOp, rightOp, children }) {
  const [dx, setDx]   = useState(0);
  const [exit, setExit] = useState(null);
  const sx = useRef(0), drag = useRef(false);

  const ts = e => { sx.current = e.touches[0].clientX; drag.current = true; };
  const tm = e => { if (!drag.current) return; setDx(Math.max(-180, Math.min(180, e.touches[0].clientX - sx.current))); };
  const te = () => {
    drag.current = false;
    if      (dx < -SWIPE_T && leftOp  !== 'none') { setExit('l'); setTimeout(onLeft,  300); }
    else if (dx >  SWIPE_T && rightOp !== 'none') { setExit('r'); setTimeout(onRight, 300); }
    else setDx(0);
  };

  const prog = Math.min(1, Math.abs(dx) / SWIPE_T);
  const lop  = SWIPE_OPS[leftOp  || 'delete'];
  const rop  = SWIPE_OPS[rightOp || 'archive'];

  return (
    <div style={{ position:'relative', overflow:'hidden', borderRadius:20 }}>
      <div style={{ position:'absolute', inset:0, borderRadius:20, backgroundColor:lop.bg, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:20, opacity:dx<0?prog:0 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <Ico d={lop.icon} s="w-6 h-6" col="#fff" />
          <span style={{ color:'#fff', fontSize:10, fontWeight:700 }}>{lop.label.toUpperCase()}</span>
        </div>
      </div>
      <div style={{ position:'absolute', inset:0, borderRadius:20, backgroundColor:rop.bg, display:'flex', alignItems:'center', paddingLeft:20, opacity:dx>0?prog:0 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <Ico d={rop.icon} s="w-6 h-6" col="#fff" />
          <span style={{ color:'#fff', fontSize:10, fontWeight:700 }}>{rop.label.toUpperCase()}</span>
        </div>
      </div>
      <div onTouchStart={ts} onTouchMove={tm} onTouchEnd={te}
        style={{ transform: exit==='l'?'translateX(-110%)':exit==='r'?'translateX(110%)':`translateX(${dx}px)`, transition:drag.current?'none':'transform .28s cubic-bezier(.4,0,.2,1)', willChange:'transform' }}>
        {children}
      </div>
    </div>
  );
}

// ─── NOTE CARD ───────────────────────────────────────────────────────────────
function NoteCard({ note, tags, onEdit, onPin, onDelete }) {
  const ntags = tags.filter(t => note.tag_ids?.includes(t.id));
  const first = ntags[0];
  const ts    = tagStyle(first?.color || P.border);

  return (
    <div onClick={() => onEdit(note)}
      style={{ backgroundColor:note.color||P.card, borderRadius:20, padding:'13px 14px', display:'flex', gap:11, boxShadow:'0 1px 6px rgba(0,0,0,.07)', border:`2px solid ${note.pinned?'#FCD34D':P.borderLight}`, cursor:'pointer', transition:'box-shadow .2s' }}>
      <div style={{ width:4, borderRadius:4, flexShrink:0, backgroundColor:first?.color||P.borderLight, alignSelf:'stretch' }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:4 }}>
          <div style={{ flex:1, minWidth:0 }}>
            {note.pinned && <span style={{ fontSize:11, color:P.primary, fontWeight:700, marginRight:5 }}>📌</span>}
            {note.title && <span style={{ fontSize:17, fontWeight:700, color:P.text, lineHeight:1.4 }}>{note.title}</span>}
          </div>
          {first && (
            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999, backgroundColor:ts.bg, color:ts.text, flexShrink:0, border:`1px solid ${first.color}44` }}>
              {first.name.toUpperCase()}
            </span>
          )}
        </div>
        {note.content && (
          <p style={{ fontSize:15, color:P.textMid, lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', marginBottom:ntags.length||note.reminder?6:0 }}>
            {note.content}
          </p>
        )}
        {(note.reminder || ntags.length > 0) && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, alignItems:'center' }}>
            {note.reminder && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:999, backgroundColor:over(note.reminder)?P.errCont:P.pCont, color:over(note.reminder)?P.error:P.primaryDark }}>
                {over(note.reminder)?'⚠️ ':'🔔 '}{fmt(note.reminder)}
              </span>
            )}
            {ntags.slice(1).map(t => {
              const ts2 = tagStyle(t.color);
              return (
                <span key={t.id} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:999, backgroundColor:ts2.bg, color:ts2.text }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', backgroundColor:t.color, display:'inline-block' }} />
                  {t.name}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'center', flexShrink:0 }} onClick={e=>e.stopPropagation()}>
        <button onClick={() => onDelete(note.id)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:15, padding:2, color:P.textLight, lineHeight:1 }}>🗑️</button>
      </div>
    </div>
  );
}

// ─── NOTE EDITOR ─────────────────────────────────────────────────────────────
function NoteEditor({ note, tags, onSave, onClose }) {
  const isNew = !note?.id;
  const [title,   setTitle]   = useState(note?.title   || '');
  const [content, setContent] = useState(note?.content || '');
  const [color,   setColor]   = useState(note?.color   || '#FFFFFF');
  const [tagIds,  setTagIds]  = useState(note?.tag_ids || []);
  const [rem,     setRem]     = useState(() => {
    if (!note?.reminder) return '';
    const d = new Date(note.reminder);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [saving, setSaving] = useState(false);

  const tog = id => setTagIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    await onSave({
      id: note?.id,
      title: title.trim(),
      content: content.trim(),
      color,
      tag_ids: tagIds,
      reminder: rem ? new Date(rem).toISOString() : null,
    });
    setSaving(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, backgroundColor:'rgba(0,0,0,.5)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:520, margin:'0 auto', backgroundColor:color||'#fff', borderRadius:'28px 28px 0 0', padding:'20px 20px 36px', maxHeight:'92vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, borderRadius:2, backgroundColor:P.border, margin:'0 auto 20px' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:P.text }}>{isNew ? 'Nueva nota' : 'Editar nota'}</h2>
          <button onClick={handleSave} disabled={saving || (!title.trim() && !content.trim())}
            style={{ backgroundColor:P.primary, color:'#fff', border:'none', borderRadius:999, padding:'8px 20px', fontSize:14, fontWeight:700, cursor:'pointer', opacity:(!title.trim()&&!content.trim())?0.4:1 }}>
            {saving ? '...' : 'Guardar'}
          </button>
        </div>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Título (opcional)"
          style={{ width:'100%', fontSize:20, fontWeight:700, border:'none', outline:'none', backgroundColor:'transparent', color:P.text, marginBottom:10, fontFamily:'inherit' }} />
        <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Escribe tu nota..." rows={5}
          style={{ width:'100%', fontSize:14, border:'none', outline:'none', backgroundColor:'transparent', color:P.textMid, resize:'none', lineHeight:1.6, marginBottom:16, fontFamily:'inherit' }} />
        <p style={{ fontSize:11, fontWeight:700, color:P.textLight, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Color</p>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {NOTE_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{ width:28, height:28, borderRadius:'50%', backgroundColor:c, border:`2px solid ${color===c?P.primary:P.border}`, cursor:'pointer', transform:color===c?'scale(1.25)':'scale(1)', transition:'all .15s', flexShrink:0 }} />
          ))}
        </div>
        {tags.length > 0 && (
          <>
            <p style={{ fontSize:11, fontWeight:700, color:P.textLight, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Etiquetas</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
              {tags.map(t => {
                const sel = tagIds.includes(t.id);
                return (
                  <button key={t.id} onClick={() => tog(t.id)}
                    style={{ padding:'5px 12px', borderRadius:999, fontSize:12, fontWeight:600, cursor:'pointer', backgroundColor:sel?t.color:(t.color+'22'), color:sel?'#fff':t.color, border:`2px solid ${sel?t.color:'transparent'}`, fontFamily:'inherit' }}>
                    {t.name}
                  </button>
                );
              })}
            </div>
          </>
        )}
        <p style={{ fontSize:11, fontWeight:700, color:P.textLight, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Recordatorio</p>
        <input type="datetime-local" value={rem} onChange={e=>setRem(e.target.value)}
          style={{ width:'100%', padding:'10px 14px', borderRadius:12, border:`1.5px solid ${P.border}`, fontSize:14, color:P.text, outline:'none', backgroundColor:P.surfHigh, fontFamily:'inherit' }} />
      </div>
    </div>
  );
}

// ─── TOOLS TAB ───────────────────────────────────────────────────────────────
function ToolsTab({ tags, onRefreshTags, swipeLeft, setSwipeLeft, swipeRight, setSwipeRight, archived, onRestore, deleted, onRestoreDeleted, onPermanentDelete, onClearHistory }) {
  const [section,      setSection]     = useState(null);
  const [newName,      setNewName]     = useState('');
  const [newColor,     setNewColor]    = useState(TAG_COLORS[0]);
  const [editTag,      setEditTag]     = useState(null);
  const [loading,      setLoading]     = useState(false);

  const saveTag = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    if (editTag) {
      await supabase.from('tags').update({ name:newName.trim(), color:newColor }).eq('id', editTag.id);
      setEditTag(null);
    } else {
      await supabase.from('tags').insert({ name:newName.trim(), color:newColor });
    }
    setNewName(''); setNewColor(TAG_COLORS[0]);
    setLoading(false); onRefreshTags();
  };

  const delTag = async (tag) => {
    if (!confirm(`¿Eliminar etiqueta "${tag.name}"?`)) return;
    await supabase.from('tags').delete().eq('id', tag.id);
    onRefreshTags();
  };

  const startEdit = (tag) => { setEditTag(tag); setNewName(tag.name); setNewColor(tag.color); };

  const updateSwipe = (dir, val) => {
    if (dir === 'left')  { setSwipeLeft(val);  localStorage.setItem('swipeLeft',  val); }
    if (dir === 'right') { setSwipeRight(val); localStorage.setItem('swipeRight', val); }
  };

  const CARD = { backgroundColor:P.card, borderRadius:20, padding:16, marginBottom:10, boxShadow:'0 1px 6px rgba(0,0,0,.07)', border:`1px solid ${P.borderLight}` };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'0 16px 120px' }}>

      {/* ── Etiquetas ── */}
      <div style={CARD}>
        <button onClick={() => setSection(section==='tags'?null:'tags')}
          style={{ display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', background:'none', border:'none', cursor:'pointer', padding:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:12, backgroundColor:P.pCont, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ico d={IC.tag} s="w-5 h-5" col={P.primaryDark} />
            </div>
            <div style={{ textAlign:'left' }}>
              <p style={{ fontSize:15, fontWeight:700, color:P.text }}>Etiquetas</p>
              <p style={{ fontSize:12, color:P.textMid }}>{tags.length} etiquetas configuradas</p>
            </div>
          </div>
          <Ico d={IC.chevron} s="w-5 h-5" col={P.textLight} />
        </button>

        {section === 'tags' && (
          <div style={{ marginTop:16 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
              {tags.map(t => (
                <div key={t.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:12, backgroundColor:P.surfHigh }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:14, height:14, borderRadius:'50%', backgroundColor:t.color }} />
                    <span style={{ fontSize:14, fontWeight:600, color:P.text }}>{t.name}</span>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => startEdit(t)} style={{ border:'none', background:P.pCont, borderRadius:8, padding:'4px 10px', fontSize:12, color:P.primaryDark, cursor:'pointer', fontWeight:600 }}>✏️</button>
                    <button onClick={() => delTag(t)}    style={{ border:'none', background:P.errCont, borderRadius:8, padding:'4px 10px', fontSize:12, color:P.error, cursor:'pointer', fontWeight:600 }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize:12, fontWeight:700, color:P.textMid, marginBottom:8 }}>{editTag ? 'Editar etiqueta' : 'Nueva etiqueta'}</p>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nombre de la etiqueta"
              style={{ width:'100%', padding:'10px 14px', borderRadius:12, border:`1.5px solid ${P.border}`, fontSize:14, outline:'none', marginBottom:10, backgroundColor:P.surfHigh, fontFamily:'inherit' }} />
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              {TAG_COLORS.map(c => (
                <button key={c} onClick={() => setNewColor(c)} style={{ width:26, height:26, borderRadius:'50%', backgroundColor:c, border:`2px solid ${newColor===c?'#000':'transparent'}`, cursor:'pointer', transform:newColor===c?'scale(1.2)':'scale(1)', flexShrink:0 }} />
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {editTag && (
                <button onClick={() => { setEditTag(null); setNewName(''); setNewColor(TAG_COLORS[0]); }}
                  style={{ flex:1, padding:'10px', borderRadius:999, border:`1.5px solid ${P.border}`, background:'none', fontSize:13, fontWeight:600, color:P.textMid, cursor:'pointer', fontFamily:'inherit' }}>
                  Cancelar
                </button>
              )}
              <button onClick={saveTag} disabled={!newName.trim() || loading}
                style={{ flex:1, padding:'10px', borderRadius:999, backgroundColor:P.primary, color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer', opacity:newName.trim()?1:.4, fontFamily:'inherit' }}>
                {editTag ? 'Guardar cambios' : 'Añadir etiqueta'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Swipe config ── */}
      <div style={CARD}>
        <button onClick={() => setSection(section==='swipe'?null:'swipe')}
          style={{ display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', background:'none', border:'none', cursor:'pointer', padding:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:12, backgroundColor:P.pCont, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ico d={IC.swipe} s="w-5 h-5" col={P.primaryDark} />
            </div>
            <div style={{ textAlign:'left' }}>
              <p style={{ fontSize:15, fontWeight:700, color:P.text }}>Acción al deslizar</p>
              <p style={{ fontSize:12, color:P.textMid }}>← {SWIPE_OPS[swipeLeft].label} · → {SWIPE_OPS[swipeRight].label}</p>
            </div>
          </div>
          <Ico d={IC.chevron} s="w-5 h-5" col={P.textLight} />
        </button>

        {section === 'swipe' && (
          <div style={{ marginTop:16 }}>
            {[['left','← Deslizar izquierda',swipeLeft],['right','→ Deslizar derecha',swipeRight]].map(([dir,label,val]) => (
              <div key={dir} style={{ marginBottom:16 }}>
                <p style={{ fontSize:12, fontWeight:700, color:P.textMid, marginBottom:8 }}>{label}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {Object.entries(SWIPE_OPS).map(([key, op]) => (
                    <button key={key} onClick={() => updateSwipe(dir, key)}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, border:`2px solid ${val===key?op.bg:P.borderLight}`, backgroundColor:val===key?op.bg+'18':P.surfHigh, cursor:'pointer', transition:'all .15s', fontFamily:'inherit' }}>
                      <div style={{ width:32, height:32, borderRadius:10, backgroundColor:val===key?op.bg:'#E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Ico d={op.icon} s="w-4 h-4" col={val===key?'#fff':'#9CA3AF'} />
                      </div>
                      <span style={{ fontSize:14, fontWeight:600, color:val===key?P.text:P.textMid }}>{op.label}</span>
                      {val===key && <span style={{ marginLeft:'auto' }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Archivadas ── */}
      <div style={CARD}>
        <button onClick={() => setSection(section==='archived'?null:'archived')}
          style={{ display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', background:'none', border:'none', cursor:'pointer', padding:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:12, backgroundColor:P.surfHigh, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ico d={IC.archive} s="w-5 h-5" col={P.textMid} />
            </div>
            <div style={{ textAlign:'left' }}>
              <p style={{ fontSize:15, fontWeight:700, color:P.text }}>Archivadas</p>
              <p style={{ fontSize:12, color:P.textMid }}>{archived.length} notas archivadas</p>
            </div>
          </div>
          <Ico d={IC.chevron} s="w-5 h-5" col={P.textLight} />
        </button>
        {section === 'archived' && (
          <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:8 }}>
            {archived.length === 0 ? (
              <p style={{ textAlign:'center', color:P.textLight, fontSize:13, padding:'12px 0' }}>No hay notas archivadas</p>
            ) : archived.map(n => (
              <div key={n.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:12, backgroundColor:P.surfHigh }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:600, color:P.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title || 'Sin título'}</p>
                </div>
                <button onClick={() => onRestore(n.id)}
                  style={{ border:'none', background:P.pCont, borderRadius:999, padding:'5px 12px', fontSize:12, color:P.primaryDark, cursor:'pointer', fontWeight:600, flexShrink:0, marginLeft:8, fontFamily:'inherit' }}>
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Historial de eliminadas ── */}
      <div style={CARD}>
        <button onClick={() => setSection(section==='deleted'?null:'deleted')}
          style={{ display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', background:'none', border:'none', cursor:'pointer', padding:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:12, backgroundColor:P.errCont, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ico d={IC.trash} s="w-5 h-5" col={P.error} />
            </div>
            <div style={{ textAlign:'left' }}>
              <p style={{ fontSize:15, fontWeight:700, color:P.text }}>Eliminadas recientemente</p>
              <p style={{ fontSize:12, color:P.textMid }}>{deleted.length} nota{deleted.length!==1?'s':''} eliminada{deleted.length!==1?'s':''}</p>
            </div>
          </div>
          <Ico d={IC.chevron} s="w-5 h-5" col={P.textLight} />
        </button>

        {section === 'deleted' && (
          <div style={{ marginTop:16 }}>
            {deleted.length === 0 ? (
              <p style={{ textAlign:'center', color:P.textLight, fontSize:13, padding:'12px 0' }}>No hay notas eliminadas</p>
            ) : (
              <>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
                  {deleted.map(n => (
                    <div key={n.id} style={{ borderRadius:12, backgroundColor:P.surfHigh, overflow:'hidden' }}>
                      <div style={{ padding:'10px 12px' }}>
                        <p style={{ fontSize:14, fontWeight:600, color:P.text, marginBottom:2 }}>{n.title || <span style={{ fontStyle:'italic', color:P.textLight }}>Sin título</span>}</p>
                        {n.content && <p style={{ fontSize:12, color:P.textMid, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.content}</p>}
                        <p style={{ fontSize:11, color:P.textLight, marginTop:4 }}>
                          Eliminada {new Date(n.deleted_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                        </p>
                      </div>
                      <div style={{ display:'flex', borderTop:`1px solid ${P.borderLight}` }}>
                        <button onClick={() => onRestoreDeleted(n.id)}
                          style={{ flex:1, padding:'8px', background:'none', border:'none', fontSize:12, fontWeight:700, color:P.primary, cursor:'pointer', fontFamily:'inherit', borderRight:`1px solid ${P.borderLight}` }}>
                          ↩ Restaurar
                        </button>
                        <button onClick={() => onPermanentDelete(n.id)}
                          style={{ flex:1, padding:'8px', background:'none', border:'none', fontSize:12, fontWeight:700, color:P.error, cursor:'pointer', fontFamily:'inherit' }}>
                          🗑️ Borrar definitivo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={onClearHistory}
                  style={{ width:'100%', padding:'10px', borderRadius:999, border:`1.5px solid ${P.error}`, background:'none', fontSize:13, fontWeight:700, color:P.error, cursor:'pointer', fontFamily:'inherit' }}>
                  Vaciar historial completo
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [notes,      setNotes]      = useState([]);
  const [tags,       setTags]       = useState([]);
  const [reminders,  setReminders]  = useState([]);
  const [view,       setView]       = useState('notes');
  const [swipeLeft,  setSwipeLeft]  = useState(() => localStorage.getItem('swipeLeft')  || 'delete');
  const [swipeRight, setSwipeRight] = useState(() => localStorage.getItem('swipeRight') || 'archive');
  const [search,     setSearch]     = useState('');
  const [activeTag,  setActiveTag]  = useState(null);
  const [editor,     setEditor]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState(null); // { msg, action?, actionLabel? }
  const [pendingDel, setPendingDel]  = useState(null); // { note, timer }
  const [pushEnabled,setPushEnabled]= useState(false);
  const [showPushBanner,setShowPushBanner] = useState(false);

  const showToast = (msg, opts = {}) => {
    setToast({ msg, ...opts });
    if (!opts.action) setTimeout(() => setToast(null), 2200);
  };

  const hideToast = () => setToast(null);

  // ── Cargar datos ──
  const loadData = async () => {
    const [{ data:notesRaw }, { data:tagsRaw }, { data:remindersRaw }, { data:noteTagsRaw }] = await Promise.all([
      supabase.from('notes').select('*').order('deleted_at', { ascending:false }).order('pinned', { ascending:false }).order('updated_at', { ascending:false }),
      supabase.from('tags').select('*').order('name'),
      supabase.from('reminders').select('*').order('scheduled_at'),
      supabase.from('note_tags').select('*'),
    ]);

    const enriched = (notesRaw || []).map(n => ({
      ...n,
      tag_ids:  (noteTagsRaw  || []).filter(nt => nt.note_id === n.id).map(nt => nt.tag_id),
      reminder: (remindersRaw || []).find(r => r.note_id === n.id && !r.sent)?.scheduled_at || null,
    }));

    setNotes(enriched);
    setTags(tagsRaw || []);
    setReminders(remindersRaw || []);
    setLoading(false);
  };

  const loadTags = async () => {
    const { data } = await supabase.from('tags').select('*').order('name');
    setTags(data || []);
  };

  useEffect(() => {
    loadData();
    checkSubscription().then(ok => {
      setPushEnabled(ok);
      if (!ok && Notification?.permission !== 'denied') setTimeout(() => setShowPushBanner(true), 2500);
    });
  }, []);

  // ── Acciones ──
  const doSwipeAction = async (action, note) => {
    const op = SWIPE_OPS[action];
    if (!op.toast) return;
    if (action === 'delete')  { await supabase.from('notes').delete().eq('id', note.id); }
    if (action === 'archive') { await supabase.from('notes').update({ archived:true }).eq('id', note.id); }
    if (action === 'pin')     { await supabase.from('notes').update({ pinned:!note.pinned }).eq('id', note.id); }
    showToast(op.toast);
    loadData();
  };

  const pinNote = async id => {
    const n = notes.find(x => x.id === id);
    await supabase.from('notes').update({ pinned:!n.pinned }).eq('id', id);
    loadData();
  };

  const deleteNote = (id) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    // Eliminación optimista — quitamos de la UI de inmediato
    setNotes(prev => prev.filter(n => n.id !== id));

    // Si había otro pendiente de eliminar, lo confirmamos ahora
    if (pendingDel) {
      clearTimeout(pendingDel.timer);
      supabase.from('notes').delete().eq('id', pendingDel.note.id);
    }

    // Timer de 5 seg para confirmar la eliminación (soft delete en BD)
    const timer = setTimeout(async () => {
      await supabase.from('notes').update({ deleted_at: new Date().toISOString() }).eq('id', note.id);
      setPendingDel(null);
      hideToast();
      loadData();
    }, 5000);

    setPendingDel({ note, timer });

    showToast('🗑️ Nota eliminada', {
      actionLabel: 'Deshacer',
      action: () => {
        clearTimeout(timer);
        setNotes(prev => [note, ...prev]);
        setPendingDel(null);
        hideToast();
      },
    });
  };

  const restoreNote = async (id, fromDeleted = false) => {
    await supabase.from('notes').update({ archived:false, deleted_at:null }).eq('id', id);
    showToast('✅ Nota restaurada');
    loadData();
  };

  const permanentDelete = async (id) => {
    await supabase.from('notes').delete().eq('id', id);
    showToast('🗑️ Eliminada permanentemente');
    loadData();
  };

  const clearHistory = async () => {
    await supabase.from('notes').delete().not('deleted_at', 'is', null);
    showToast('🧹 Historial borrado');
    loadData();
  };

  const saveNote = async ({ id, title, content, color, tag_ids, reminder }) => {
    let noteId = id;
    if (id) {
      await supabase.from('notes').update({ title, content, color }).eq('id', id);
    } else {
      const { data } = await supabase.from('notes').insert({ title, content, color, pinned:false, archived:false }).select().single();
      noteId = data?.id;
    }
    if (!noteId) return;

    await supabase.from('note_tags').delete().eq('note_id', noteId);
    if (tag_ids?.length) {
      await supabase.from('note_tags').insert(tag_ids.map(tag_id => ({ note_id:noteId, tag_id })));
    }

    const existing = reminders.find(r => r.note_id === noteId && !r.sent);
    if (reminder) {
      if (existing) {
        await supabase.from('reminders').update({ scheduled_at:reminder, sent:false }).eq('id', existing.id);
      } else {
        await supabase.from('reminders').insert({ note_id:noteId, title:title||'Recordatorio', body:content?.slice(0,100)||'', scheduled_at:reminder });
      }
    } else if (existing) {
      await supabase.from('reminders').delete().eq('id', existing.id);
    }

    setEditor(null);
    showToast(id ? '✅ Nota guardada' : '✅ Nota creada');
    loadData();
  };

  const handleEnablePush = async () => {
    const ok = await subscribeToPush(supabase);
    if (ok) { setPushEnabled(true); setShowPushBanner(false); showToast('🔔 Notificaciones activadas'); }
  };

  // ── Filtros ──
  const active   = notes.filter(n => !n.archived && !n.deleted_at);
  const archived = notes.filter(n =>  n.archived && !n.deleted_at);
  const deleted  = notes.filter(n =>  n.deleted_at).sort((a,b) => new Date(b.deleted_at)-new Date(a.deleted_at));

  const visible = active.filter(n => {
    const mt = !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase());
    const mg = !activeTag || n.tag_ids?.includes(activeTag);
    return mt && mg;
  });

  const pinned   = visible.filter(n => n.pinned);
  const unpinned = visible.filter(n => !n.pinned);

  // Recordatorios = notas activas con recordatorio
  const withRem  = active.filter(n => n.reminder);
  const remOver  = withRem.filter(n => over(n.reminder));
  const remSoon  = withRem.filter(n => !over(n.reminder));

  const TABS = [
    { id:'notes',     label:'Notas',         icon:IC.note  },
    { id:'reminders', label:'Recordatorios', icon:IC.bell  },
    { id:'tools',     label:'Herramientas',  icon:IC.tools },
  ];

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', backgroundColor:P.bg }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:48, height:48, border:`4px solid ${P.primary}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' }} />
          <p style={{ color:P.textMid, fontSize:14, fontWeight:500 }}>Cargando...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', backgroundColor:P.bg, maxWidth:520, margin:'0 auto', fontFamily:"'DM Sans',system-ui,sans-serif", display:'flex', flexDirection:'column', position:'relative' }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:'fixed', bottom:96, left:0, right:0, maxWidth:520, margin:'0 auto', display:'flex', justifyContent:'center', zIndex:200, padding:'0 16px' }}>
          <div style={{ backgroundColor:P.onPCont, color:P.pCont, padding:'12px 16px', borderRadius:16, fontSize:13, fontWeight:600, boxShadow:'0 4px 24px rgba(0,0,0,.25)', display:'flex', alignItems:'center', gap:12, width:'100%', maxWidth:400 }}>
            <span style={{ flex:1 }}>{toast.msg}</span>
            {toast.action && (
              <button onClick={toast.action}
                style={{ background:'none', border:`1.5px solid ${P.pCont}`, color:P.pCont, borderRadius:999, padding:'4px 14px', fontSize:13, fontWeight:800, cursor:'pointer', flexShrink:0, fontFamily:'inherit', letterSpacing:.3 }}>
                {toast.actionLabel}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ background:`linear-gradient(135deg, ${P.gradA} 0%, ${P.gradB} 100%)`, borderRadius:'0 0 32px 32px', padding:'52px 22px 22px', marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <div>
            <p style={{ color:'#FCD34D', fontSize:13, fontWeight:500, marginBottom:3 }}>
              {new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })}
            </p>
            <p style={{ color:'white', fontSize:26, fontWeight:800, letterSpacing:'-0.5px' }}>RubenceTask</p>
          </div>
          <div style={{ background:'rgba(255,255,255,.18)', backdropFilter:'blur(8px)', borderRadius:14, padding:'6px 12px', color:'white', fontSize:13, fontWeight:600 }}>
            {active.length} nota{active.length!==1?'s':''}
          </div>
        </div>
        {/* Barra push banner */}
        {showPushBanner && !pushEnabled && (
          <div style={{ background:'rgba(255,255,255,.15)', borderRadius:14, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Ico d={IC.bell} s="w-4 h-4" col="#fff" />
              <span style={{ color:'white', fontSize:13, fontWeight:600 }}>Activar notificaciones</span>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setShowPushBanner(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.6)', cursor:'pointer', fontSize:16 }}>×</button>
              <button onClick={handleEnablePush} style={{ background:'white', color:P.primaryDark, border:'none', borderRadius:999, padding:'4px 12px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Activar</button>
            </div>
          </div>
        )}
        {/* Search */}
        <div style={{ background:'white', borderRadius:16, display:'flex', alignItems:'center', gap:10, padding:'9px 14px', boxShadow:'0 4px 16px rgba(0,0,0,.15)' }}>
          <Ico d={IC.search} s="w-4 h-4" col={P.textLight} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar notas..."
            style={{ border:'none', outline:'none', flex:1, fontSize:14, color:P.text, fontFamily:"'DM Sans',system-ui,sans-serif", background:'transparent' }} />
          {search && <button onClick={()=>setSearch('')} style={{ border:'none', background:'none', cursor:'pointer', color:P.textLight, fontSize:18, padding:0, lineHeight:1 }}>×</button>}
        </div>
      </div>

      {/* ── NOTAS ── */}
      {view === 'notes' && (
        <div style={{ flex:1, overflowY:'auto', paddingBottom:120 }}>
          {/* Filter chips */}
          <div style={{ position:'relative', marginBottom:14, padding:'0 16px' }}>
            <div style={{ display:'flex', gap:7, overflowX:'auto', paddingBottom:4, paddingRight:32, scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
              {[{ id:null, name:'Todas', color:null }, ...tags].map(t => {
                const active = activeTag === t.id;
                return (
                  <button key={t.id||'all'} onClick={() => setActiveTag(active ? null : t.id)}
                    style={{ flexShrink:0, padding:'5px 14px', borderRadius:999, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .15s', border:`2px solid ${active?(t.color||P.primary):'transparent'}`, backgroundColor:active?(t.color+'22'||P.pCont):P.borderLight, color:active?(t.color||P.primaryDark):P.textMid, fontFamily:'inherit' }}>
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:10 }}>
            {pinned.length > 0 && (
              <>
                <p style={{ fontSize:11, fontWeight:700, color:P.textLight, textTransform:'uppercase', letterSpacing:1 }}>📌 Fijadas</p>
                {pinned.map(n => (
                  <Swipeable key={n.id} leftOp={swipeLeft} rightOp={swipeRight} onLeft={() => doSwipeAction(swipeLeft, n)} onRight={() => doSwipeAction(swipeRight, n)}>
                    <NoteCard note={n} tags={tags} onEdit={() => setEditor(n)} onPin={pinNote} onDelete={deleteNote} />
                  </Swipeable>
                ))}
                {unpinned.length > 0 && <p style={{ fontSize:11, fontWeight:700, color:P.textLight, textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>Notas</p>}
              </>
            )}
            {unpinned.map(n => (
              <Swipeable key={n.id} leftOp={swipeLeft} rightOp={swipeRight} onLeft={() => doSwipeAction(swipeLeft, n)} onRight={() => doSwipeAction(swipeRight, n)}>
                <NoteCard note={n} tags={tags} onEdit={() => setEditor(n)} onPin={pinNote} onDelete={deleteNote} />
              </Swipeable>
            ))}
            {visible.length === 0 && (
              <div style={{ textAlign:'center', paddingTop:60 }}>
                <div style={{ fontSize:56, marginBottom:12 }}>📝</div>
                <p style={{ fontWeight:700, color:P.textMid, fontSize:16 }}>Sin notas</p>
                <p style={{ color:P.textLight, fontSize:13, marginTop:4 }}>Pulsa + para crear una</p>
              </div>
            )}
          </div>

          {/* Extended FAB M3 */}
          <div style={{ position:'fixed', bottom:88, right:16, zIndex:10 }}>
            <button onClick={() => setEditor('new')}
              style={{ display:'flex', alignItems:'center', gap:8, height:56, padding:'0 20px', backgroundColor:P.pCont, color:P.onPCont, border:'none', borderRadius:999, fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 3px 8px rgba(123,88,0,.24),0 6px 20px rgba(123,88,0,.15)', fontFamily:'inherit' }}>
              <Ico d={IC.plus} s="w-6 h-6" col={P.onPCont} />
              Nueva nota
            </button>
          </div>
        </div>
      )}

      {/* ── RECORDATORIOS ── */}
      {view === 'reminders' && (
        <div style={{ flex:1, overflowY:'auto', padding:'0 16px', paddingBottom:100 }}>
          {withRem.length === 0 ? (
            <div style={{ textAlign:'center', paddingTop:60 }}>
              <div style={{ fontSize:56, marginBottom:12 }}>🔔</div>
              <p style={{ fontWeight:700, color:P.textMid, fontSize:16 }}>Sin recordatorios</p>
              <p style={{ color:P.textLight, fontSize:13, marginTop:4 }}>Añade un recordatorio a una nota</p>
            </div>
          ) : (
            <>
              {remOver.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:P.error, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>⚠️ Vencidos</p>
                  {remOver.map(n => (
                    <div key={n.id} onClick={() => setEditor(n)}
                      style={{ backgroundColor:P.card, borderRadius:20, overflow:'hidden', display:'flex', marginBottom:8, boxShadow:'0 1px 6px rgba(0,0,0,.07)', border:`1px solid ${P.errCont}`, cursor:'pointer' }}>
                      <div style={{ width:4, backgroundColor:P.error }} />
                      <div style={{ flex:1, padding:'12px 14px' }}>
                        <p style={{ fontWeight:700, fontSize:15, color:P.text }}>{n.title}</p>
                        <p style={{ fontSize:12, color:P.error, fontWeight:600, marginTop:3 }}>⚠️ {fmt(n.reminder)}</p>
                      </div>
                      <div style={{ padding:'12px 12px', display:'flex', alignItems:'center' }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:999, backgroundColor:P.errCont, color:P.error }}>VENCIDO</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {remSoon.length > 0 && (
                <div>
                  <p style={{ fontSize:11, fontWeight:700, color:P.primary, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>🔔 Próximos</p>
                  {remSoon.map(n => (
                    <div key={n.id} onClick={() => setEditor(n)}
                      style={{ backgroundColor:P.card, borderRadius:20, overflow:'hidden', display:'flex', marginBottom:8, boxShadow:'0 1px 6px rgba(0,0,0,.07)', border:`1px solid ${P.borderLight}`, cursor:'pointer' }}>
                      <div style={{ width:4, backgroundColor:P.primary }} />
                      <div style={{ flex:1, padding:'12px 14px' }}>
                        <p style={{ fontWeight:700, fontSize:15, color:P.text }}>{n.title}</p>
                        <p style={{ fontSize:12, color:P.primary, fontWeight:600, marginTop:3 }}>🔔 {fmt(n.reminder)}</p>
                      </div>
                      <div style={{ padding:'12px 12px', display:'flex', alignItems:'center' }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:999, backgroundColor:P.pCont, color:P.primaryDark }}>PRÓXIMO</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── HERRAMIENTAS ── */}
      {view === 'tools' && (
        <ToolsTab
          tags={tags} onRefreshTags={loadTags}
          swipeLeft={swipeLeft} setSwipeLeft={setSwipeLeft}
          swipeRight={swipeRight} setSwipeRight={setSwipeRight}
          archived={archived} onRestore={restoreNote}
          deleted={deleted} onRestoreDeleted={restoreNote} onPermanentDelete={permanentDelete} onClearHistory={clearHistory}
        />
      )}

      {/* ── BOTTOM NAV ── */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, maxWidth:520, width:'100%', margin:'0 auto', backgroundColor:'rgba(255,251,240,.97)', backdropFilter:'blur(20px)', borderTop:`1px solid ${P.borderLight}`, display:'flex', boxShadow:`0 -2px 16px rgba(123,88,0,.07)` }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 0 8px', gap:4, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
            <div style={{ width:64, height:32, borderRadius:999, display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:view===t.id?P.secCont:'transparent', transition:'background .2s' }}>
              <Ico d={t.icon} s="w-5 h-5" col={view===t.id?P.primary:P.textLight} />
            </div>
            <span style={{ fontSize:11, fontWeight:600, color:view===t.id?P.primary:P.textLight }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── EDITOR ── */}
      {editor && (
        <NoteEditor
          note={editor === 'new' ? null : editor}
          tags={tags}
          onSave={saveNote}
          onClose={() => setEditor(null)}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
