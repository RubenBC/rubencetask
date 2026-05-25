import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { subscribeToPush, checkSubscription } from './lib/push';

const Icon = ({ d, size = 'w-5 h-5', stroke = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={size} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} d={d} />
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

const NOTE_COLORS = [
  { label: 'Blanco',   value: '#FFFBFE' },
  { label: 'Lavanda',  value: '#F6EDFF' },
  { label: 'Rosa',     value: '#FCE4EC' },
  { label: 'Azul',     value: '#E3F2FD' },
  { label: 'Verde',    value: '#E8F5E9' },
  { label: 'Amarillo', value: '#FFFDE7' },
  { label: 'Naranja',  value: '#FFF3E0' },
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

function TagChip({ tag, selected, onClick, small, onRemove }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full font-medium transition-all
        ${small ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}
        ${selected ? 'shadow-sm' : 'opacity-75 hover:opacity-100'}`}
      style={{
        backgroundColor: selected ? tag.color : tag.color + '25',
        color: selected ? '#fff' : tag.color,
        border: `1.5px solid ${tag.color}`,
      }}
    >
      {tag.name}
      {onRemove && (
        <span onClick={(e) => { e.stopPropagation(); onRemove(); }} className="ml-0.5 leading-none hover:opacity-60">×</span>
      )}
    </button>
  );
}

function NoteCard({ note, tags, onClick }) {
  const noteTags = tags.filter(t => note.tag_ids?.includes(t.id));
  const reminder = note.reminder;
  return (
    <div
      onClick={() => onClick(note)}
      className="rounded-3xl p-4 cursor-pointer transition-all duration-150 hover:shadow-md active:scale-95 relative overflow-hidden"
      style={{ backgroundColor: note.color || '#FFFBFE' }}
    >
      {note.pinned && (
        <span className="absolute top-3 right-3 text-purple-500 opacity-50">
          <Icon d={Icons.pin} size="w-3.5 h-3.5" />
        </span>
      )}
      {note.title && <p className="font-semibold text-gray-800 text-[15px] leading-snug mb-1 pr-4 line-clamp-2">{note.title}</p>}
      {note.content && <p className="text-gray-500 text-[13px] leading-relaxed line-clamp-4">{note.content}</p>}
      {reminder && !reminder.sent && (
        <div className={`flex items-center gap-1 mt-2 text-[11px] font-medium ${isOverdue(reminder.scheduled_at) ? 'text-red-500' : 'text-purple-600'}`}>
          <Icon d={Icons.bell} size="w-3 h-3" />
          <span>{fmt(reminder.scheduled_at)}</span>
        </div>
      )}
      {noteTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {noteTags.map(t => <TagChip key={t.id} tag={t} selected small />)}
        </div>
      )}
    </div>
  );
}

function NoteEditor({ note, tags, onSave, onDelete, onClose }) {
  const isNew = !note?.id;
  const [title, setTitle]               = useState(note?.title || '');
  const [content, setContent]           = useState(note?.content || '');
  const [color, setColor]               = useState(note?.color || '#FFFBFE');
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
      <div className="flex items-center justify-between px-3 pt-12 pb-2">
        <button onClick={onClose} className="p-2.5 rounded-full hover:bg-black/10 transition-colors">
          <Icon d={Icons.back} size="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => setPinned(!pinned)} className={`p-2.5 rounded-full transition-colors ${pinned ? 'text-purple-700 bg-purple-100' : 'hover:bg-black/10'}`}>
            <Icon d={Icons.pin} size="w-5 h-5" />
          </button>
          {!isNew && (
            <button onClick={() => onDelete(note.id)} className="p-2.5 rounded-full hover:bg-red-50 text-red-400 transition-colors">
              <Icon d={Icons.delete} size="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || (!title.trim() && !content.trim())}
            className="bg-[#6750A4] text-white px-5 py-2 rounded-full text-sm font-semibold ml-1 disabled:opacity-40 active:scale-95 transition-all"
          >
            {saving ? '...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-10 space-y-5">
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Título"
          className="w-full text-[26px] font-bold bg-transparent border-none outline-none text-gray-800 placeholder-gray-300"
        />
        <textarea
          value={content} onChange={e => setContent(e.target.value)}
          placeholder="Escribe tu nota..." rows={7}
          className="w-full text-[15px] bg-transparent border-none outline-none text-gray-700 placeholder-gray-300 resize-none leading-relaxed"
        />

        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Color</p>
          <div className="flex gap-2.5 flex-wrap">
            {NOTE_COLORS.map(({ value }) => (
              <button key={value} onClick={() => setColor(value)}
                className="w-8 h-8 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: value,
                  borderColor: color === value ? '#6750A4' : '#ddd',
                  transform: color === value ? 'scale(1.25)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        {tags.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Etiquetas</p>
            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <TagChip key={t.id} tag={t} selected={selTags.includes(t.id)} onClick={() => toggleTag(t.id)} />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Recordatorio</p>
            <button onClick={() => setShowReminder(!showReminder)}
              className={`p-2 rounded-full transition-colors ${showReminder ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-black/10'}`}>
              <Icon d={Icons.bell} size="w-5 h-5" />
            </button>
          </div>
          {showReminder && (
            <div className="space-y-2.5">
              <input type="text" value={remTitle} onChange={e => setRemTitle(e.target.value)}
                placeholder="Título del recordatorio"
                className="w-full bg-white/60 border border-purple-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-purple-400"
              />
              <input type="datetime-local" value={remDate} onChange={e => setRemDate(e.target.value)}
                className="w-full bg-white/60 border border-purple-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-purple-400"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HomeView({ notes, tags, onNoteClick, onNewNote }) {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);

  const filtered = notes.filter(n => {
    const matchText = !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase());
    const matchTag = !activeTag || n.tag_ids?.includes(activeTag);
    return matchText && matchTag;
  });

  const pinned   = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  return (
    <div className="flex-1 overflow-y-auto pb-28">
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-white rounded-3xl px-4 py-3 shadow-sm">
          <Icon d={Icons.search} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar notas..."
            className="flex-1 bg-transparent outline-none text-gray-700 text-sm" />
          {search && <button onClick={() => setSearch('')} className="text-gray-300"><Icon d={Icons.close} size="w-4 h-4" /></button>}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTag(null)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium border transition-all ${!activeTag ? 'bg-[#6750A4] text-white border-[#6750A4]' : 'border-gray-300 text-gray-500'}`}>
            Todas
          </button>
          {tags.map(t => (
            <div key={t.id} className="flex-shrink-0">
              <TagChip tag={t} selected={activeTag === t.id} onClick={() => setActiveTag(activeTag === t.id ? null : t.id)} />
            </div>
          ))}
        </div>
      )}

      <div className="px-4 space-y-4">
        {pinned.length > 0 && (
          <>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Fijadas</p>
            <div className="grid grid-cols-2 gap-3">
              {pinned.map(n => <NoteCard key={n.id} note={n} tags={tags} onClick={onNoteClick} />)}
            </div>
          </>
        )}
        {unpinned.length > 0 && (
          <>
            {pinned.length > 0 && <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 mt-5">Otras</p>}
            <div className="grid grid-cols-2 gap-3">
              {unpinned.map(n => <NoteCard key={n.id} note={n} tags={tags} onClick={onNoteClick} />)}
            </div>
          </>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-24 text-gray-300">
            <div className="text-6xl mb-3">📝</div>
            <p className="font-semibold text-gray-400">Sin notas</p>
            <p className="text-sm mt-1">Pulsa + para crear una</p>
          </div>
        )}
      </div>

      <button onClick={onNewNote}
        className="fixed bottom-24 right-4 w-16 h-16 bg-[#6750A4] rounded-2xl shadow-xl flex items-center justify-center text-white active:scale-95 transition-all"
        style={{ boxShadow: '0 4px 20px rgba(103,80,164,0.4)' }}>
        <Icon d={Icons.plus} size="w-7 h-7" stroke={2.5} />
      </button>
    </div>
  );
}

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
      <h2 className="text-[22px] font-bold text-gray-800 mb-5 mt-1">Etiquetas</h2>
      <div className="bg-white rounded-3xl p-5 shadow-sm mb-5">
        <p className="text-sm font-semibold text-gray-500 mb-3">{editing ? 'Editar etiqueta' : 'Nueva etiqueta'}</p>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la etiqueta"
          className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-purple-400 mb-4" />
        <div className="flex gap-2 mb-4">
          {TAG_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} className="w-7 h-7 rounded-full border-2 transition-all"
              style={{ backgroundColor: c, borderColor: color === c ? '#222' : 'transparent', transform: color === c ? 'scale(1.2)' : 'scale(1)' }} />
          ))}
        </div>
        {name && <div className="mb-4"><TagChip tag={{ name, color }} selected /></div>}
        <div className="flex gap-2">
          {editing && (
            <button onClick={() => { setEditing(null); setName(''); setColor(TAG_COLORS[0]); }}
              className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-medium text-gray-500">
              Cancelar
            </button>
          )}
          <button onClick={save} disabled={!name.trim() || loading}
            className="flex-1 py-2.5 rounded-2xl bg-[#6750A4] text-white text-sm font-semibold disabled:opacity-40">
            {editing ? 'Guardar cambios' : 'Añadir etiqueta'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {tags.map(tag => (
          <div key={tag.id} className="bg-white rounded-2xl px-4 py-3.5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: tag.color }} />
              <span className="font-medium text-gray-800 text-[15px]">{tag.name}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => startEdit(tag)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
                <Icon d={Icons.edit} size="w-4 h-4" />
              </button>
              <button onClick={() => del(tag)} className="p-2 rounded-full hover:bg-red-50 text-red-400">
                <Icon d={Icons.delete} size="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {tags.length === 0 && (
          <div className="text-center py-16 text-gray-300">
            <div className="text-5xl mb-2">🏷️</div>
            <p className="text-gray-400 font-medium">Sin etiquetas</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RemindersView({ reminders, notes }) {
  const getNote = (id) => notes.find(n => n.id === id);
  const upcoming = reminders.filter(r => !r.sent && !isOverdue(r.scheduled_at));
  const overdue  = reminders.filter(r => !r.sent && isOverdue(r.scheduled_at));
  const sent     = reminders.filter(r => r.sent).slice(0, 15);

  const Item = ({ r, type }) => {
    const note = getNote(r.note_id);
    const colors = {
      overdue:  { border: 'border-red-400',   text: 'text-red-500',    badge: 'bg-red-50 text-red-400' },
      upcoming: { border: 'border-[#6750A4]', text: 'text-purple-600', badge: 'bg-purple-50 text-purple-600' },
      sent:     { border: 'border-gray-200',  text: 'text-gray-400',   badge: 'bg-gray-100 text-gray-400' },
    }[type];
    return (
      <div className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${colors.border} ${type === 'sent' ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">{r.title}</p>
            {note && <p className="text-xs text-gray-400 mt-0.5 truncate">📝 {note.title || 'Sin título'}</p>}
            <p className={`text-xs mt-1.5 font-medium ${colors.text}`}>{fmt(r.scheduled_at)}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${colors.badge}`}>
            {type === 'sent' ? '✓ Enviado' : type === 'overdue' ? 'Vencido' : 'Próximo'}
          </span>
        </div>
      </div>
    );
  };

  const Section = ({ title, items, type, color }) => items.length > 0 ? (
    <div className="mb-5">
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${color}`}>{title}</p>
      <div className="space-y-2">{items.map(r => <Item key={r.id} r={r} type={type} />)}</div>
    </div>
  ) : null;

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4">
      <h2 className="text-[22px] font-bold text-gray-800 mb-5 mt-1">Recordatorios</h2>
      <Section title="Vencidos"  items={overdue}  type="overdue"  color="text-red-400" />
      <Section title="Próximos"  items={upcoming} type="upcoming" color="text-purple-600" />
      <Section title="Enviados"  items={sent}     type="sent"     color="text-gray-400" />
      {reminders.length === 0 && (
        <div className="text-center py-24 text-gray-300">
          <div className="text-6xl mb-3">🔔</div>
          <p className="text-gray-400 font-medium">Sin recordatorios</p>
          <p className="text-sm mt-1">Añade uno desde una nota</p>
        </div>
      )}
    </div>
  );
}

function BottomNav({ view, onChange }) {
  const tabs = [
    { id: 'home',      label: 'Notas',         icon: Icons.note },
    { id: 'reminders', label: 'Recordatorios', icon: Icons.bell },
    { id: 'tags',      label: 'Etiquetas',     icon: Icons.tag  },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/90 backdrop-blur-md border-t border-gray-100 flex">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${view === t.id ? 'text-[#6750A4]' : 'text-gray-400'}`}>
          <div className={`px-4 py-1 rounded-full transition-all ${view === t.id ? 'bg-[#EDE7F6]' : ''}`}>
            <Icon d={t.icon} size="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function PushBanner({ onEnable, onDismiss }) {
  return (
    <div className="mx-4 mb-2 bg-[#EDE7F6] rounded-3xl p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#6750A4] rounded-2xl flex items-center justify-center text-white flex-shrink-0">
          <Icon d={Icons.bell} size="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#4a3880]">Activar notificaciones</p>
          <p className="text-xs text-[#6750A4]">Recibe alertas de recordatorios</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={onDismiss} className="p-1.5 text-[#6750A4] opacity-50">
          <Icon d={Icons.close} size="w-4 h-4" />
        </button>
        <button onClick={onEnable} className="bg-[#6750A4] text-white text-xs font-bold px-3 py-1.5 rounded-full">
          Activar
        </button>
      </div>
    </div>
  );
}

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F3EDF7]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#6750A4] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3EDF7] flex flex-col max-w-lg mx-auto relative">
      <div className="px-5 pt-14 pb-3 bg-[#F3EDF7]">
        <h1 className="text-3xl font-bold text-[#21005D]">
          {view === 'home' ? '📝 Notas' : view === 'tags' ? '🏷️ Etiquetas' : '🔔 Recordatorios'}
        </h1>
      </div>

      {showPushBanner && !pushEnabled && (
        <PushBanner onEnable={handleEnablePush} onDismiss={() => setShowPushBanner(false)} />
      )}

      {view === 'home'      && <HomeView notes={notes} tags={tags} onNoteClick={n => { setEditingNote(n); setShowEditor(true); }} onNewNote={() => { setEditingNote(null); setShowEditor(true); }} />}
      {view === 'tags'      && <TagsView tags={tags} onRefresh={loadData} />}
      {view === 'reminders' && <RemindersView reminders={reminders} notes={notes} />}

      <BottomNav view={view} onChange={setView} />

      {showEditor && (
        <NoteEditor note={editingNote} tags={tags} onSave={saveNote} onDelete={deleteNote} onClose={() => setShowEditor(false)} />
      )}
    </div>
  );
}