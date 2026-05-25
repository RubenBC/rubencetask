import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { subscribeToPush, checkSubscription } from './lib/push';

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 'w-5 h-5', color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`${size} ${color || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

const Icons = {
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  close:  'M6 18L18 6M6 6l12 12',
  plus:   'M12 4v16m8-8H4',
  back:   'M15 19l-7-7 7-7',
  delete: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  edit:   'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  pin:    'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
  bell:   'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  tag:    'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
  note:   'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const NOTE_COLORS = [
  { label: 'Blanco',   value: '#FFFFFF' },
  { label: 'Lavanda',  value: '#EDE7F6' },
  { label: 'Rosa',     value: '#FCE4EC' },
  { label: 'Cielo',    value: '#E1F5FE' },
  { label: 'Menta',    value: '#E8F5E9' },
  { label: 'Miel',     value: '#FFF8E1' },
  { label: 'Melocotón',value: '#FBE9E7' },
  { label: 'Lila',     value: '#F3E5F5' },
];

const TAG_COLORS = [
  '#6750A4','#B5179E','#4361EE','#0096C7',
  '#06D6A0','#FFB703','#FB8500','#EF233C',
];

const fmt = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });
};
const isOverdue = (d) => d && new Date(d) < new Date();

// ─── TAG CHIP ─────────────────────────────────────────────────────────────────
function TagChip({ tag, selected, onClick, small }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-full font-medium whitespace-nowrap transition-all
        ${small ? 'text-[11px] px-2 py-0.5' : 'text-[13px] px-3.5 py-1.5'}
        ${selected ? 'shadow-sm scale-[1.03]' : 'opacity-80 hover:opacity-100'}`}
      style={{
        backgroundColor: selected ? tag.color : tag.color + '22',
        color: selected ? '#fff' : tag.color,
        border: `1.5px solid ${tag.color}${selected ? '' : '66'}`,
      }}
    >
      {tag.name}
    </button>
  );
}

// ─── NOTE CARD ────────────────────────────────────────────────────────────────
function NoteCard({ note, tags, onClick }) {
  const noteTags = tags.filter(t => note.tag_ids?.includes(t.id));
  const reminder = note.reminder;
  const hasColor = note.color && note.color !== '#FFFFFF';

  return (
    <div
      onClick={() => onClick(note)}
      className="w-full rounded-[28px] overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.98]"
      style={{
        backgroundColor: note.color || '#FFFFFF',
        boxShadow: hasColor
          ? '0 2px 16px rgba(103,80,164,0.10)'
          : '0 2px 16px rgba(103,80,164,0.07)',
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: hasColor ? note.color : '#EDE7F6', filter: 'brightness(0.85)' }}
      />

      <div className="px-5 pt-4 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            {note.title ? (
              <h3 className="font-bold text-[#1C1B1F] text-[18px] leading-snug truncate">{note.title}</h3>
            ) : (
              <h3 className="font-medium text-[#79747E] text-[16px] italic">Sin título</h3>
            )}
          </div>
          {note.pinned && (
            <div className="flex-shrink-0 mt-0.5">
              <Icon d={Icons.pin} size="w-4 h-4" color="text-[#6750A4] opacity-60" />
            </div>
          )}
        </div>

        {/* Content */}
        {note.content && (
          <p className="text-[#49454F] text-[14px] leading-relaxed line-clamp-3">{note.content}</p>
        )}

        {/* Footer */}
        {(reminder || noteTags.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {reminder && !reminder.sent && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full
                ${isOverdue(reminder.scheduled_at)
                  ? 'bg-red-100 text-red-600'
                  : 'bg-[#6750A4]/10 text-[#6750A4]'}`}
              >
                <Icon d={Icons.bell} size="w-3 h-3" />
                {fmt(reminder.scheduled_at)}
              </span>
            )}
            {noteTags.map(t => <TagChip key={t.id} tag={t} selected small />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NOTE EDITOR ──────────────────────────────────────────────────────────────
function NoteEditor({ note, tags, onSave, onDelete, onClose }) {
  const isNew = !note?.id;
  const [title, setTitle]               = useState(note?.title || '');
  const [content, setContent]           = useState(note?.content || '');
  const [color, setColor]               = useState(note?.color || '#FFFFFF');
  const [pinned, setPinned]             = useState(note?.pinned || false);
  const [selTags, setSelTags]           = useState(note?.tag_ids || []);
  const [showReminder, setShowReminder] = useState(false);
  const [remDate, setRemDate]           = useState('');
  const [remTitle, setRemTitle]         = useState('');
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    if (note?.reminder && !note.reminder.sent) {
      setShowReminder(true);
      const d = new Date(note.reminder.scheduled_at);
      setRemDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      setRemTitle(note.reminder.title || '');
    }
  }, []);

  const toggleTag = (id) =>
    setSelTags(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    await onSave({
      id: note?.id, title: title.trim(), content: content.trim(),
      color, pinned, tag_ids: selTags,
      reminder: showReminder && remDate
        ? { id: note?.reminder?.id, title: remTitle || title || 'Recordatorio', scheduled_at: new Date(remDate).toISOString() }
        : null,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: color }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 pt-12 pb-2">
        <button onClick={onClose} className="p-2.5 rounded-full hover:bg-black/8 transition-colors">
          <Icon d={Icons.back} size="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => setPinned(!pinned)}
            className={`p-2.5 rounded-full transition-colors ${pinned ? 'text-[#6750A4] bg-[#EDE7F6]' : 'hover:bg-black/8'}`}>
            <Icon d={Icons.pin} size="w-5 h-5" />
          </button>
          {!isNew && (
            <button onClick={() => onDelete(note.id)}
              className="p-2.5 rounded-full hover:bg-red-50 text-red-400 transition-colors">
              <Icon d={Icons.delete} size="w-5 h-5" />
            </button>
          )}
          <button onClick={handleSave}
            disabled={saving || (!title.trim() && !content.trim())}
            className="bg-[#6750A4] text-white px-5 py-2 rounded-full text-sm font-semibold ml-1 disabled:opacity-40 active:scale-95 transition-all"
            style={{ boxShadow: '0 2px 10px rgba(103,80,164,0.35)' }}>
            {saving ? '...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-10 space-y-5">
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Título"
          className="w-full text-[26px] font-bold bg-transparent border-none outline-none text-[#1C1B1F] placeholder-[#C4C7C5]" />
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Escribe tu nota..." rows={7}
          className="w-full text-[15px] bg-transparent border-none outline-none text-[#49454F] placeholder-[#C4C7C5] resize-none leading-relaxed" />

        {/* Color picker */}
        <div>
          <p className="text-[11px] font-bold text-[#79747E] uppercase tracking-widest mb-3">Color de nota</p>
          <div className="flex gap-3 flex-wrap">
            {NOTE_COLORS.map(({ value }) => (
              <button key={value} onClick={() => setColor(value)}
                className="w-9 h-9 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: value,
                  borderColor: color === value ? '#6750A4' : '#E8DEF8',
                  transform: color === value ? 'scale(1.25)' : 'scale(1)',
                  boxShadow: color === value ? '0 0 0 3px #EDE7F6' : '0 1px 3px rgba(0,0,0,0.1)',
                }} />
            ))}
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-[#79747E] uppercase tracking-widest mb-3">Etiquetas</p>
            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <TagChip key={t.id} tag={t} selected={selTags.includes(t.id)} onClick={() => toggleTag(t.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Reminder */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-[#79747E] uppercase tracking-widest">Recordatorio</p>
            <button onClick={() => setShowReminder(!showReminder)}
              className={`p-2 rounded-full transition-colors ${showReminder ? 'bg-[#EDE7F6] text-[#6750A4]' : 'text-[#79747E] hover:bg-black/8'}`}>
              <Icon d={Icons.bell} size="w-5 h-5" />
            </button>
          </div>
          {showReminder && (
            <div className="space-y-2.5">
              <input type="text" value={remTitle} onChange={e => setRemTitle(e.target.value)}
                placeholder="Título del recordatorio"
                className="w-full bg-white/70 border border-[#CAC4D0] rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#6750A4] transition-colors" />
              <input type="datetime-local" value={remDate} onChange={e => setRemDate(e.target.value)}
                className="w-full bg-white/70 border border-[#CAC4D0] rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#6750A4] transition-colors" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── HOME VIEW ────────────────────────────────────────────────────────────────
function HomeView({ notes, tags, onNoteClick, onNewNote }) {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);

  const filtered = notes.filter(n => {
    const matchText = !search ||
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.content?.toLowerCase().includes(search.toLowerCase());
    const matchTag = !activeTag || n.tag_ids?.includes(activeTag);
    return matchText && matchTag;
  });

  const pinned   = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Search bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5"
          style={{ boxShadow: '0 2px 12px rgba(103,80,164,0.10)' }}>
          <Icon d={Icons.search} color="text-[#79747E]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar notas..."
            className="flex-1 bg-transparent outline-none text-[#1C1B1F] text-[15px] placeholder-[#79747E]" />
          {search && (
            <button onClick={() => setSearch('')} className="text-[#79747E]">
              <Icon d={Icons.close} size="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal scrollable tags */}
      {tags.length > 0 && (
        <div className="pb-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4">
            <button
              onClick={() => setActiveTag(null)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold border-2 transition-all
                ${!activeTag
                  ? 'bg-[#6750A4] text-white border-[#6750A4]'
                  : 'bg-white text-[#6750A4] border-[#CAC4D0]'}`}
            >
              Todas
            </button>
            {tags.map(t => (
              <div key={t.id} className="flex-shrink-0">
                <TagChip
                  tag={t}
                  selected={activeTag === t.id}
                  onClick={() => setActiveTag(activeTag === t.id ? null : t.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="px-4 flex flex-col gap-3">
        {pinned.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-1 mt-1">
              <Icon d={Icons.pin} size="w-3.5 h-3.5" color="text-[#79747E]" />
              <p className="text-[11px] font-bold text-[#79747E] uppercase tracking-widest">Fijadas</p>
            </div>
            {pinned.map(n => <NoteCard key={n.id} note={n} tags={tags} onClick={onNoteClick} />)}
          </>
        )}

        {unpinned.length > 0 && (
          <>
            {pinned.length > 0 && (
              <p className="text-[11px] font-bold text-[#79747E] uppercase tracking-widest px-1 mt-3">Notas</p>
            )}
            {unpinned.map(n => <NoteCard key={n.id} note={n} tags={tags} onClick={onNoteClick} />)}
          </>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">📝</div>
            <p className="font-semibold text-[#49454F] text-[16px]">Sin notas</p>
            <p className="text-[#79747E] text-sm mt-1">Pulsa + para crear una</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={onNewNote}
        className="fixed bottom-24 right-5 w-16 h-16 bg-[#6750A4] rounded-[20px] flex items-center justify-center text-white active:scale-95 transition-all"
        style={{ boxShadow: '0 6px 24px rgba(103,80,164,0.45)' }}>
        <Icon d={Icons.plus} size="w-7 h-7" />
      </button>
    </div>
  );
}

// ─── TAGS VIEW ────────────────────────────────────────────────────────────────
function TagsView({ tags, onRefresh }) {
  const [name, setName]       = useState('');
  const [color, setColor]     = useState(TAG_COLORS[0]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setLoading(true);
    if (editing) {
      await supabase.from('tags').update({ name: name.trim(), color }).eq('id', editing.id);
    } else {
      await supabase.from('tags').insert({ name: name.trim(), color });
    }
    setName(''); setColor(TAG_COLORS[0]); setEditing(null);
    setLoading(false); onRefresh();
  };

  const del = async (tag) => {
    if (!confirm(`¿Eliminar "${tag.name}"?`)) return;
    await supabase.from('tags').delete().eq('id', tag.id);
    onRefresh();
  };

  const startEdit = (tag) => {
    setEditing(tag); setName(tag.name); setColor(tag.color);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4">
      {/* Form */}
      <div className="bg-white rounded-[28px] p-5 mb-5" style={{ boxShadow: '0 2px 16px rgba(103,80,164,0.08)' }}>
        <p className="text-sm font-bold text-[#49454F] mb-4">{editing ? 'Editar etiqueta' : 'Nueva etiqueta'}</p>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Nombre de la etiqueta"
          className="w-full border-2 border-[#E8DEF8] rounded-2xl px-4 py-3 text-[15px] outline-none focus:border-[#6750A4] transition-colors mb-4 bg-[#FDFBFF]" />

        <div className="flex gap-3 mb-4">
          {TAG_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full border-2 transition-all flex-shrink-0"
              style={{
                backgroundColor: c,
                borderColor: color === c ? '#1C1B1F' : 'transparent',
                transform: color === c ? 'scale(1.2)' : 'scale(1)',
              }} />
          ))}
        </div>

        {name && (
          <div className="mb-4">
            <TagChip tag={{ name, color }} selected />
          </div>
        )}

        <div className="flex gap-2">
          {editing && (
            <button onClick={() => { setEditing(null); setName(''); setColor(TAG_COLORS[0]); }}
              className="flex-1 py-3 rounded-2xl border-2 border-[#CAC4D0] text-sm font-semibold text-[#49454F] active:scale-95 transition-all">
              Cancelar
            </button>
          )}
          <button onClick={save} disabled={!name.trim() || loading}
            className="flex-1 py-3 rounded-2xl bg-[#6750A4] text-white text-sm font-bold disabled:opacity-40 active:scale-95 transition-all"
            style={{ boxShadow: '0 2px 10px rgba(103,80,164,0.3)' }}>
            {editing ? 'Guardar' : 'Añadir'}
          </button>
        </div>
      </div>

      {/* Tags list */}
      <div className="flex flex-col gap-2">
        {tags.map(tag => (
          <div key={tag.id} className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between"
            style={{ boxShadow: '0 1px 8px rgba(103,80,164,0.07)' }}>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
              <span className="font-semibold text-[#1C1B1F] text-[15px]">{tag.name}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => startEdit(tag)} className="p-2 rounded-full hover:bg-[#F3EDF7] text-[#79747E] transition-colors">
                <Icon d={Icons.edit} size="w-4 h-4" />
              </button>
              <button onClick={() => del(tag)} className="p-2 rounded-full hover:bg-red-50 text-red-400 transition-colors">
                <Icon d={Icons.delete} size="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {tags.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🏷️</div>
            <p className="text-[#49454F] font-semibold">Sin etiquetas</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── REMINDERS VIEW ───────────────────────────────────────────────────────────
function RemindersView({ reminders, notes }) {
  const getNote = (id) => notes.find(n => n.id === id);
  const upcoming = reminders.filter(r => !r.sent && !isOverdue(r.scheduled_at));
  const overdue  = reminders.filter(r => !r.sent && isOverdue(r.scheduled_at));
  const sent     = reminders.filter(r => r.sent).slice(0, 15);

  const Item = ({ r, type }) => {
    const note = getNote(r.note_id);
    const styles = {
      overdue:  { bar: '#EF4444', bg: 'bg-white', badge: 'bg-red-50 text-red-500', text: 'text-red-500' },
      upcoming: { bar: '#6750A4', bg: 'bg-white', badge: 'bg-[#EDE7F6] text-[#6750A4]', text: 'text-[#6750A4]' },
      sent:     { bar: '#CAC4D0', bg: 'bg-white/60', badge: 'bg-gray-100 text-gray-400', text: 'text-gray-400' },
    }[type];

    return (
      <div className={`${styles.bg} rounded-2xl overflow-hidden flex ${type === 'sent' ? 'opacity-60' : ''}`}
        style={{ boxShadow: '0 1px 8px rgba(103,80,164,0.07)' }}>
        <div className="w-1 flex-shrink-0" style={{ backgroundColor: styles.bar }} />
        <div className="flex-1 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#1C1B1F] text-[15px] truncate">{r.title}</p>
              {note && <p className="text-[12px] text-[#79747E] mt-0.5 truncate">📝 {note.title || 'Sin título'}</p>}
              <p className={`text-[12px] font-semibold mt-1.5 ${styles.text}`}>{fmt(r.scheduled_at)}</p>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${styles.badge}`}>
              {type === 'sent' ? '✓ Enviado' : type === 'overdue' ? 'Vencido' : 'Próximo'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const Section = ({ title, items, type, color }) => items.length > 0 ? (
    <div className="mb-5">
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-2.5 ${color}`}>{title}</p>
      <div className="flex flex-col gap-2">
        {items.map(r => <Item key={r.id} r={r} type={type} />)}
      </div>
    </div>
  ) : null;

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4">
      <Section title="Vencidos"  items={overdue}  type="overdue"  color="text-red-500" />
      <Section title="Próximos"  items={upcoming} type="upcoming" color="text-[#6750A4]" />
      <Section title="Enviados"  items={sent}     type="sent"     color="text-[#79747E]" />
      {reminders.length === 0 && (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🔔</div>
          <p className="font-semibold text-[#49454F] text-[16px]">Sin recordatorios</p>
          <p className="text-[#79747E] text-sm mt-1">Añade uno desde una nota</p>
        </div>
      )}
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ view, onChange }) {
  const tabs = [
    { id: 'home',      label: 'Notas',         icon: Icons.note },
    { id: 'reminders', label: 'Recordatorios', icon: Icons.bell },
    { id: 'tags',      label: 'Etiquetas',     icon: Icons.tag  },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur-xl border-t border-[#E8DEF8] flex"
      style={{ boxShadow: '0 -4px 20px rgba(103,80,164,0.08)' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-colors">
          <div className={`flex items-center justify-center px-5 py-1.5 rounded-full transition-all duration-200
            ${view === t.id ? 'bg-[#EDE7F6]' : ''}`}>
            <Icon d={t.icon} size="w-5 h-5"
              color={view === t.id ? 'text-[#6750A4]' : 'text-[#79747E]'} />
          </div>
          <span className={`text-[11px] font-semibold transition-colors
            ${view === t.id ? 'text-[#6750A4]' : 'text-[#79747E]'}`}>
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── PUSH BANNER ──────────────────────────────────────────────────────────────
function PushBanner({ onEnable, onDismiss }) {
  return (
    <div className="mx-4 mb-3 rounded-[24px] overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6750A4 100%)', boxShadow: '0 4px 20px rgba(103,80,164,0.35)' }}>
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Icon d={Icons.bell} size="w-5 h-5" color="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Activar notificaciones</p>
            <p className="text-xs text-white/70">Recibe alertas de tus recordatorios</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={onDismiss} className="p-1.5 text-white/50 hover:text-white">
            <Icon d={Icons.close} size="w-4 h-4" />
          </button>
          <button onClick={onEnable}
            className="bg-white text-[#6750A4] text-xs font-bold px-3.5 py-1.5 rounded-full active:scale-95 transition-all">
            Activar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]               = useState('home');
  const [notes, setNotes]             = useState([]);
  const [tags, setTags]               = useState([]);
  const [reminders, setReminders]     = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [showEditor, setShowEditor]   = useState(false);
  const [loading, setLoading]         = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showPushBanner, setShowPushBanner] = useState(false);

  const loadData = async () => {
    const [{ data: notesRaw }, { data: tagsRaw }, { data: remindersRaw }, { data: noteTagsRaw }] =
      await Promise.all([
        supabase.from('notes').select('*').order('pinned', { ascending: false }).order('updated_at', { ascending: false }),
        supabase.from('tags').select('*').order('name'),
        supabase.from('reminders').select('*').order('scheduled_at'),
        supabase.from('note_tags').select('*'),
      ]);

    const enriched = (notesRaw || []).map(n => ({
      ...n,
      tag_ids: (noteTagsRaw || []).filter(nt => nt.note_id === n.id).map(nt => nt.tag_id),
      reminder: (remindersRaw || []).find(r => r.note_id === n.id && !r.sent) || null,
    }));

    setNotes(enriched);
    setTags(tagsRaw || []);
    setReminders(remindersRaw || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    checkSubscription().then(enabled => {
      setPushEnabled(enabled);
      if (!enabled && Notification?.permission !== 'denied') {
        setTimeout(() => setShowPushBanner(true), 2500);
      }
    });
  }, []);

  const handleEnablePush = async () => {
    const ok = await subscribeToPush(supabase);
    if (ok) { setPushEnabled(true); setShowPushBanner(false); }
  };

  const saveNote = async ({ id, title, content, color, pinned, tag_ids, reminder }) => {
    let noteId = id;
    if (id) {
      await supabase.from('notes').update({ title, content, color, pinned }).eq('id', id);
    } else {
      const { data } = await supabase.from('notes').insert({ title, content, color, pinned }).select().single();
      noteId = data?.id;
    }
    if (!noteId) return;

    await supabase.from('note_tags').delete().eq('note_id', noteId);
    if (tag_ids?.length) {
      await supabase.from('note_tags').insert(tag_ids.map(tag_id => ({ note_id: noteId, tag_id })));
    }

    if (reminder) {
      if (reminder.id) {
        await supabase.from('reminders').update({ title: reminder.title, scheduled_at: reminder.scheduled_at, sent: false }).eq('id', reminder.id);
      } else {
        await supabase.from('reminders').insert({ note_id: noteId, title: reminder.title, body: content?.slice(0, 100) || '', scheduled_at: reminder.scheduled_at });
      }
    } else if (id) {
      await supabase.from('reminders').delete().eq('note_id', id).eq('sent', false);
    }

    setShowEditor(false);
    loadData();
  };

  const deleteNote = async (id) => {
    if (!confirm('¿Eliminar esta nota?')) return;
    await supabase.from('notes').delete().eq('id', id);
    setShowEditor(false);
    loadData();
  };

  const viewTitles = { home: '📝 Notas', tags: '🏷️ Etiquetas', reminders: '🔔 Recordatorios' };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F6F0FF]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#6750A4] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#79747E] text-sm font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F0FF] flex flex-col max-w-lg mx-auto relative">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-[#F6F0FF]">
        <h1 className="text-[28px] font-bold text-[#21005D]">{viewTitles[view]}</h1>
      </div>

      {/* Push banner */}
      {showPushBanner && !pushEnabled && (
        <PushBanner onEnable={handleEnablePush} onDismiss={() => setShowPushBanner(false)} />
      )}

      {view === 'home'      && <HomeView notes={notes} tags={tags}
        onNoteClick={n => { setEditingNote(n); setShowEditor(true); }}
        onNewNote={() => { setEditingNote(null); setShowEditor(true); }} />}
      {view === 'tags'      && <TagsView tags={tags} onRefresh={loadData} />}
      {view === 'reminders' && <RemindersView reminders={reminders} notes={notes} />}

      <BottomNav view={view} onChange={setView} />

      {showEditor && (
        <NoteEditor note={editingNote} tags={tags}
          onSave={saveNote} onDelete={deleteNote}
          onClose={() => setShowEditor(false)} />
      )}
    </div>
  );
}
