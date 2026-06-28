import { useState, useRef, useEffect, useCallback } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const SLASH_ITEMS = [
  { type: "p",        icon: "¶",    name: "Текст",            desc: "Обычный абзац" },
  { type: "h1",       icon: "H1",   name: "Заголовок 1",      desc: "Крупный заголовок" },
  { type: "h2",       icon: "H2",   name: "Заголовок 2",      desc: "Средний заголовок" },
  { type: "h3",       icon: "H3",   name: "Заголовок 3",      desc: "Малый заголовок" },
  { type: "bullet",   icon: "•",    name: "Список",           desc: "Маркированный список" },
  { type: "numbered", icon: "1.",   name: "Нумерованный",     desc: "Список с номерами" },
  { type: "todo",     icon: "☐",    name: "Чекбокс",          desc: "Задача с галочкой" },
  { type: "quote",    icon: "❝",    name: "Цитата",           desc: "Выделенная цитата" },
  { type: "callout",  icon: "💡",   name: "Выноска",          desc: "Информационный блок" },
  { type: "code",     icon: "</>",  name: "Код",              desc: "Блок кода" },
  { type: "divider",  icon: "—",    name: "Разделитель",      desc: "Горизонтальная линия" },
];

const AI_CHIPS = [
  "Подведи итог страницы",
  "Расширь текст",
  "Составь план",
  "Исправь орфографию",
  "Переведи на английский",
  "Сделай краче",
];

const EMOJIS = ["📋","💡","📅","📚","🎯","🚀","📝","🔥","⭐","🧠","💼","🗂️","📌","🎨","💻"];

let _id = 1000;
const uid = () => ++_id;

const INIT_PAGES = [
  {
    id: 1, emoji: "📋", title: "Главная",
    blocks: [
      { id: uid(), type: "h1",     text: "Добро пожаловать в NoteAI 👋" },
      { id: uid(), type: "callout",text: "💡 Нажми / в любом блоке, чтобы вставить заголовок, список, код и многое другое." },
      { id: uid(), type: "h2",     text: "Что умеет это приложение" },
      { id: uid(), type: "bullet", text: "Создавай страницы и разделы в боковой панели" },
      { id: uid(), type: "bullet", text: "Используй / для вставки 10+ типов блоков" },
      { id: uid(), type: "bullet", text: "Спрашивай ИИ-ассистента — он видит содержимое страницы" },
      { id: uid(), type: "bullet", text: "Вставляй ответ ИИ прямо в документ одной кнопкой" },
      { id: uid(), type: "p",      text: "" },
    ],
  },
  {
    id: 2, emoji: "🚀", title: "Идеи",
    blocks: [
      { id: uid(), type: "h1",     text: "Идеи проекта" },
      { id: uid(), type: "h2",     text: "В работе" },
      { id: uid(), type: "todo",   text: "Новый дизайн лендинга", checked: true },
      { id: uid(), type: "todo",   text: "Интеграция с API" },
      { id: uid(), type: "h2",     text: "На потом" },
      { id: uid(), type: "bullet", text: "Мобильное приложение" },
      { id: uid(), type: "bullet", text: "Тёмная тема" },
      { id: uid(), type: "p",      text: "" },
    ],
  },
  {
    id: 3, emoji: "📅", title: "Задачи",
    blocks: [
      { id: uid(), type: "h1",     text: "Задачи на неделю" },
      { id: uid(), type: "todo",   text: "Подготовить дизайн-макеты", checked: true },
      { id: uid(), type: "todo",   text: "Написать техзадание" },
      { id: uid(), type: "todo",   text: "Встреча с командой в четверг" },
      { id: uid(), type: "todo",   text: "Ревью кода" },
      { id: uid(), type: "p",      text: "" },
    ],
  },
  {
    id: 4, emoji: "📚", title: "База знаний",
    blocks: [
      { id: uid(), type: "h1",     text: "База знаний" },
      { id: uid(), type: "p",      text: "Собирай полезные материалы в одном месте." },
      { id: uid(), type: "h2",     text: "Инструменты" },
      { id: uid(), type: "bullet", text: "Figma — дизайн интерфейсов" },
      { id: uid(), type: "bullet", text: "VS Code — редактор кода" },
      { id: uid(), type: "quote",  text: "Лучший инструмент — тот, которым пользуешься." },
      { id: uid(), type: "h2",     text: "Пример кода" },
      { id: uid(), type: "code",   text: 'const greet = (name) => `Привет, ${name}!`;\nconsole.log(greet("мир"));' },
      { id: uid(), type: "p",      text: "" },
    ],
  },
];

// ── Block component ───────────────────────────────────────────────────────────

function Block({ block, index, onUpdate, onEnter, onBackspace, onSlash, shouldFocus, onFocus, numberedIndex }) {
  const ref = useRef(null);

  useEffect(() => {
    if (shouldFocus && ref.current) {
      ref.current.focus();
      try {
        const r = document.createRange();
        r.selectNodeContents(ref.current);
        r.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
      } catch (_) {}
    }
  }, [shouldFocus]);

  if (block.type === "divider") {
    return <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />;
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEnter(block.id); }
    if (e.key === "Backspace" && !ref.current?.textContent) { e.preventDefault(); onBackspace(block.id); }
  };

  const handleInput = () => {
    const text = ref.current?.textContent || "";
    if (text.endsWith("/")) onSlash(block.id, ref.current);
    onUpdate(block.id, text);
  };

  const style = getBlockStyle(block.type);

  if (block.type === "todo") {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "2px 0" }}>
        <input
          type="checkbox"
          checked={!!block.checked}
          onChange={() => onUpdate(block.id, ref.current?.textContent || "", !block.checked)}
          style={{ marginTop: 4, width: 15, height: 15, cursor: "pointer", accentColor: "#3b82f6", flexShrink: 0 }}
        />
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onFocus={() => onFocus(block.id)}
          data-placeholder="Задача..."
          style={{
            ...style,
            flex: 1,
            textDecoration: block.checked ? "line-through" : "none",
            color: block.checked ? "#9ca3af" : "#111827",
          }}
        >{block.text}</div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", margin: "1px 0", display: "flex", alignItems: "flex-start", gap: 6 }}>
      {block.type === "bullet" && (
        <span style={{ color: "#9ca3af", flexShrink: 0, marginTop: 3, fontSize: 15, lineHeight: "1.7", userSelect: "none" }}>•</span>
      )}
      {block.type === "numbered" && (
        <span style={{ color: "#6b7280", flexShrink: 0, marginTop: 3, fontSize: 15, lineHeight: "1.7", minWidth: 20, userSelect: "none" }}>{numberedIndex}.</span>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onFocus={() => onFocus(block.id)}
        data-placeholder={getPlaceholder(block.type)}
        style={{ ...style, flex: 1, outline: "none", minHeight: 28 }}
      >{block.text}</div>
    </div>
  );
}

function getPlaceholder(type) {
  if (type === "p") return "Начни писать или нажми / для команд...";
  if (type === "h1") return "Заголовок 1";
  if (type === "h2") return "Заголовок 2";
  if (type === "h3") return "Заголовок 3";
  if (type === "quote") return "Цитата...";
  if (type === "callout") return "Заметка...";
  if (type === "code") return "Код...";
  return "";
}

function getBlockStyle(type) {
  const base = { outline: "none", minHeight: 28, wordBreak: "break-word" };
  switch (type) {
    case "h1": return { ...base, fontSize: 28, fontWeight: 600, lineHeight: "1.2", margin: "16px 0 4px", color: "#111827" };
    case "h2": return { ...base, fontSize: 21, fontWeight: 600, lineHeight: "1.3", margin: "12px 0 2px", color: "#111827" };
    case "h3": return { ...base, fontSize: 17, fontWeight: 600, lineHeight: "1.3", margin: "8px 0 2px", color: "#111827" };
    case "bullet":
    case "numbered":
    case "p":  return { ...base, fontSize: 15, lineHeight: "1.75", color: "#374151" };
    case "quote": return { ...base, fontSize: 15, lineHeight: "1.75", color: "#6b7280", fontStyle: "italic", paddingLeft: 14, borderLeft: "3px solid #93c5fd", borderRadius: 0 };
    case "callout": return { ...base, fontSize: 15, lineHeight: "1.75", color: "#1e3a5f", background: "#eff6ff", border: "0.5px solid #bfdbfe", borderRadius: 8, padding: "10px 14px" };
    case "code": return { ...base, fontSize: 13, fontFamily: "'Fira Code', 'Courier New', monospace", lineHeight: "1.6", color: "#1f2937", background: "#f3f4f6", border: "0.5px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", whiteSpace: "pre-wrap" };
    default: return { ...base, fontSize: 15, lineHeight: "1.75", color: "#374151" };
  }
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [pages, setPages] = useState(INIT_PAGES);
  const [currentId, setCurrentId] = useState(1);
  const [focusId, setFocusId] = useState(null);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [aiOpen, setAiOpen] = useState(true);
  const [aiMessages, setAiMessages] = useState([
    { role: "assistant", text: "Привет! Я вижу содержимое открытой страницы и готов помочь — дополнить текст, составить структуру, подвести итог или ответить на вопрос." }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [slash, setSlash] = useState({ open: false, blockId: null, pos: null, filter: "" });
  const [slashIdx, setSlashIdx] = useState(0);
  const [emojiPicker, setEmojiPicker] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("noteai_key") || "");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const aiEndRef = useRef(null);
  const aiInputRef = useRef(null);

  const page = pages.find(p => p.id === currentId);

  const updatePages = useCallback((fn) => {
    setPages(prev => prev.map(p => p.id === currentId ? fn(p) : p));
  }, [currentId]);

  // ── Block handlers ──────────────────────────────────────────────────────────

  const handleUpdate = useCallback((blockId, text, checked) => {
    updatePages(p => ({
      ...p,
      blocks: p.blocks.map(b =>
        b.id === blockId ? { ...b, text, ...(checked !== undefined ? { checked } : {}) } : b
      )
    }));
  }, [updatePages]);

  const handleEnter = useCallback((blockId) => {
    closeSlash();
    const nb = { id: uid(), type: "p", text: "" };
    updatePages(p => {
      const i = p.blocks.findIndex(b => b.id === blockId);
      const blocks = [...p.blocks];
      blocks.splice(i + 1, 0, nb);
      return { ...p, blocks };
    });
    setFocusId(nb.id);
  }, [updatePages]);

  const handleBackspace = useCallback((blockId) => {
    updatePages(p => {
      if (p.blocks.length <= 1) return p;
      const i = p.blocks.findIndex(b => b.id === blockId);
      const prev = p.blocks[i - 1];
      if (prev) setFocusId(prev.id);
      return { ...p, blocks: p.blocks.filter(b => b.id !== blockId) };
    });
  }, [updatePages]);

  const handleSlashOpen = useCallback((blockId, el) => {
    const rect = el.getBoundingClientRect();
    setSlash({ open: true, blockId, pos: { top: rect.bottom + 6, left: rect.left }, filter: "" });
    setSlashIdx(0);
  }, []);

  const closeSlash = () => setSlash(s => ({ ...s, open: false }));

  const insertBlock = (type) => {
    closeSlash();
    const nb = { id: uid(), type, text: "", ...(type === "todo" ? { checked: false } : {}) };
    updatePages(p => {
      const i = p.blocks.findIndex(b => b.id === slash.blockId);
      const blocks = [...p.blocks];
      blocks[i] = { ...blocks[i], text: blocks[i].text.replace(/\/$/, "") };
      if (type === "divider") {
        blocks.splice(i + 1, 0, { id: uid(), type: "divider", text: "" });
        blocks.splice(i + 2, 0, { id: uid(), type: "p", text: "" });
        setTimeout(() => setFocusId(blocks[i + 2].id), 0);
        return { ...p, blocks };
      }
      blocks.splice(i + 1, 0, nb);
      return { ...p, blocks };
    });
    if (type !== "divider") setFocusId(nb.id);
  };

  // ── Page handlers ───────────────────────────────────────────────────────────

  const addPage = () => {
    const p = { id: uid(), emoji: "📄", title: "Новая страница", blocks: [{ id: uid(), type: "p", text: "" }] };
    setPages(prev => [...prev, p]);
    setCurrentId(p.id);
  };

  const deletePage = (id, e) => {
    e.stopPropagation();
    setPages(prev => {
      const next = prev.filter(p => p.id !== id);
      if (currentId === id && next.length > 0) setCurrentId(next[0].id);
      return next.length > 0 ? next : prev;
    });
  };

  // ── AI handler ──────────────────────────────────────────────────────────────

  const sendAI = async (overrideMsg) => {
    const text = overrideMsg || aiInput.trim();
    if (!text || aiLoading) return;
    setAiInput("");

    const key = apiKey || process.env.REACT_APP_ANTHROPIC_KEY;
    if (!key) { setShowKeyModal(true); return; }

    setAiMessages(prev => [...prev, { role: "user", text }]);
    setAiLoading(true);

    const pageText = page.blocks.map(b => b.text).filter(Boolean).join("\n");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: `Ты ИИ-ассистент встроенный в редактор заметок NoteAI. Текущая страница: "${page.title}". Её содержимое:\n${pageText || "(пусто)"}\n\nОтвечай кратко и по делу на русском. При генерации текста для вставки — используй markdown: # ## ### - для структуры.`,
          messages: [{ role: "user", content: text }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const reply = data.content?.[0]?.text || "Пустой ответ.";
      setAiMessages(prev => [...prev, { role: "assistant", text: reply, canInsert: true }]);
    } catch (err) {
      setAiMessages(prev => [...prev, { role: "assistant", text: `Ошибка: ${err.message}` }]);
    }
    setAiLoading(false);
  };

  const insertAIText = (text) => {
    const lines = text.split("\n").filter(l => l.trim());
    const newBlocks = lines.map(line => {
      let type = "p", content = line;
      if (line.startsWith("# "))   { type = "h1"; content = line.slice(2); }
      else if (line.startsWith("## "))  { type = "h2"; content = line.slice(3); }
      else if (line.startsWith("### ")) { type = "h3"; content = line.slice(4); }
      else if (line.match(/^[-•*] /))   { type = "bullet"; content = line.slice(2); }
      else if (line.match(/^\d+\. /))   { type = "numbered"; content = line.replace(/^\d+\. /, ""); }
      return { id: uid(), type, text: content };
    });
    updatePages(p => ({ ...p, blocks: [...p.blocks, ...newBlocks] }));
  };

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);
  useEffect(() => {
    const close = (e) => { if (!e.target.closest("#slash-menu")) closeSlash(); };
    if (slash.open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [slash.open]);

  useEffect(() => {
    if (focusId) { const t = setTimeout(() => setFocusId(null), 100); return () => clearTimeout(t); }
  }, [focusId]);

  // ── Numbered index helper ───────────────────────────────────────────────────

  const getNumberedIndex = (blocks, idx) => {
    let count = 0;
    for (let i = idx; i >= 0; i--) {
      if (blocks[i].type === "numbered") count++;
      else break;
    }
    return count;
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const filteredSlash = SLASH_ITEMS.filter(i =>
    !slash.filter || i.name.toLowerCase().includes(slash.filter.toLowerCase())
  );

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: "#fff", overflow: "hidden" }}>

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <div style={{ width: 240, minWidth: 240, background: "#f7f7f5", borderRight: "1px solid #e9e9e7", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 10px 6px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>N</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>NoteAI</span>
            <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, lineHeight: 1 }}>‹</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
            <div style={{ fontSize: 11, color: "#9ca3af", padding: "6px 14px 2px", textTransform: "uppercase", letterSpacing: ".06em" }}>Страницы</div>
            {pages.map(p => (
              <div
                key={p.id}
                onClick={() => setCurrentId(p.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "5px 10px", margin: "1px 6px",
                  borderRadius: 6, cursor: "pointer", fontSize: 13,
                  color: p.id === currentId ? "#111827" : "#6b7280",
                  background: p.id === currentId ? "#e9e9e7" : "transparent",
                  transition: "background .1s",
                }}
              >
                <span style={{ flexShrink: 0 }}>{p.emoji}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title || "Без названия"}</span>
                <button
                  onClick={(e) => deletePage(p.id, e)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", fontSize: 14, lineHeight: 1, padding: "0 2px", opacity: 0, transition: "opacity .1s" }}
                  onMouseEnter={e => e.target.style.opacity = 1}
                  onMouseLeave={e => e.target.style.opacity = 0}
                  title="Удалить"
                >×</button>
              </div>
            ))}
            <div
              onClick={addPage}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 10px", margin: "2px 6px", borderRadius: 6, cursor: "pointer", fontSize: 13, color: "#9ca3af" }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Новая страница
            </div>
          </div>

          <div style={{ padding: 8, borderTop: "1px solid #e9e9e7" }}>
            <div
              onClick={() => setAiOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#4f46e5", background: "#e0e7ff", border: "0.5px solid #c7d2fe" }}
            >
              <span>✨</span> ИИ-ассистент
            </div>
            <div
              onClick={() => setShowKeyModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#6b7280", marginTop: 4 }}
            >
              <span>🔑</span> API ключ
            </div>
          </div>
        </div>
      )}

      {/* ── Editor ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>
        {/* Topbar */}
        <div style={{ height: 46, borderBottom: "1px solid #e9e9e7", display: "flex", alignItems: "center", padding: "0 16px", gap: 10, flexShrink: 0, background: "#fff" }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, lineHeight: 1 }}>☰</button>
          )}
          <div style={{ fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
            <span>NoteAI</span>
            <span>›</span>
            <span style={{ color: "#374151" }}>{page?.title || "Без названия"}</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button
              onClick={() => setAiOpen(o => !o)}
              style={{ padding: "4px 12px", borderRadius: 6, border: "0.5px solid #c7d2fe", background: aiOpen ? "#e0e7ff" : "transparent", color: "#4f46e5", cursor: "pointer", fontSize: 13 }}
            >✨ ИИ</button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "48px 80px 120px", maxWidth: 860, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          {/* Emoji picker */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
            <button
              onClick={() => setEmojiPicker(e => !e)}
              style={{ fontSize: 48, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 8, lineHeight: 1 }}
            >{page?.emoji}</button>
            {emojiPicker && (
              <div style={{ position: "absolute", top: "100%", left: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, zIndex: 50, display: "flex", flexWrap: "wrap", gap: 4, width: 220, boxShadow: "0 4px 20px rgba(0,0,0,.1)" }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => { updatePages(p => ({ ...p, emoji: e })); setEmojiPicker(false); }}
                    style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", borderRadius: 6, padding: 4, width: 36, height: 36 }}>{e}</button>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div
            contentEditable
            suppressContentEditableWarning
            onInput={e => setPages(prev => prev.map(p => p.id === currentId ? { ...p, title: e.target.textContent } : p))}
            data-placeholder="Без названия"
            style={{ fontSize: 38, fontWeight: 700, color: "#111827", outline: "none", marginBottom: 16, lineHeight: 1.2, wordBreak: "break-word", minHeight: 46 }}
          >{page?.title}</div>

          {/* Blocks */}
          {page?.blocks.map((block, i) => (
            <Block
              key={block.id}
              block={block}
              index={i}
              numberedIndex={getNumberedIndex(page.blocks, i)}
              onUpdate={handleUpdate}
              onEnter={handleEnter}
              onBackspace={handleBackspace}
              onSlash={handleSlashOpen}
              shouldFocus={block.id === focusId}
              onFocus={setActiveBlockId}
            />
          ))}
        </div>
      </div>

      {/* ── AI Panel ── */}
      <div style={{
        width: aiOpen ? 310 : 0, minWidth: aiOpen ? 310 : 0,
        borderLeft: "1px solid #e9e9e7", display: "flex", flexDirection: "column",
        background: "#f7f7f5", overflow: "hidden",
        transition: "width .2s, min-width .2s",
      }}>
        <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid #e9e9e7", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✨</div>
          <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: "#111827" }}>ИИ-ассистент</span>
          <button onClick={() => setAiOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16 }}>×</button>
        </div>

        {/* Chips */}
        <div style={{ padding: "8px 12px 0", display: "flex", flexWrap: "wrap", gap: 4, flexShrink: 0 }}>
          {AI_CHIPS.map(chip => (
            <button key={chip} onClick={() => sendAI(chip)} style={{ padding: "3px 10px", background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 20, fontSize: 12, color: "#6b7280", cursor: "pointer" }}>{chip}</button>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {aiMessages.map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>{msg.role === "user" ? "Вы" : "ИИ"}</span>
              <div style={{
                fontSize: 13, lineHeight: 1.65, color: "#111827",
                background: msg.role === "user" ? "#e0e7ff" : "#fff",
                border: `0.5px solid ${msg.role === "user" ? "#c7d2fe" : "#e5e7eb"}`,
                borderRadius: 10, padding: "9px 12px", maxWidth: "92%", whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>{msg.text}</div>
              {msg.canInsert && (
                <button onClick={() => insertAIText(msg.text)} style={{ fontSize: 11, color: "#4f46e5", background: "#e0e7ff", border: "none", borderRadius: 5, padding: "3px 10px", cursor: "pointer" }}>
                  ↓ Вставить на страницу
                </button>
              )}
            </div>
          ))}
          {aiLoading && (
            <div style={{ display: "flex", gap: 4, padding: "6px 12px" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#d1d5db", animation: `bounce .8s ${i * .15}s infinite` }} />
              ))}
            </div>
          )}
          <div ref={aiEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid #e9e9e7", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
            <textarea
              ref={aiInputRef}
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAI(); } }}
              placeholder="Спроси ИИ..."
              rows={1}
              style={{ flex: 1, resize: "none", border: "0.5px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 13, background: "#fff", color: "#111827", fontFamily: "inherit", outline: "none", minHeight: 38, maxHeight: 120, overflowY: "auto" }}
            />
            <button
              onClick={() => sendAI()}
              disabled={aiLoading}
              style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: aiLoading ? "#93c5fd" : "#4f46e5", color: "#fff", cursor: aiLoading ? "default" : "pointer", fontSize: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
            >↑</button>
          </div>
        </div>
      </div>

      {/* ── Slash menu ── */}
      {slash.open && slash.pos && (
        <div
          id="slash-menu"
          style={{ position: "fixed", top: slash.pos.top, left: slash.pos.left, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 6, zIndex: 999, minWidth: 230, maxHeight: 340, overflowY: "auto", boxShadow: "0 8px 30px rgba(0,0,0,.12)" }}
        >
          {filteredSlash.length === 0 && <div style={{ fontSize: 13, color: "#9ca3af", padding: "8px 12px" }}>Ничего не найдено</div>}
          {filteredSlash.map((item, i) => (
            <div
              key={item.type}
              onClick={() => insertBlock(item.type)}
              onMouseEnter={() => setSlashIdx(i)}
              style={{ padding: "7px 10px", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: i === slashIdx ? "#f3f4f6" : "transparent" }}
            >
              <div style={{ width: 30, height: 30, border: "0.5px solid #e5e7eb", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, background: "#f9fafb", flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{item.name}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── API Key modal ── */}
      {showKeyModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6, color: "#111827" }}>API ключ Anthropic</h2>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>
              Чтобы ИИ-ассистент работал, укажи ключ с сайта{" "}
              <a href="https://console.anthropic.com/keys" target="_blank" rel="noreferrer" style={{ color: "#4f46e5" }}>console.anthropic.com</a>.
              Ключ сохраняется только в твоём браузере.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", marginBottom: 14, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowKeyModal(false)} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13 }}>Отмена</button>
              <button onClick={() => { localStorage.setItem("noteai_key", apiKey); setShowKeyModal(false); }} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#4f46e5", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}
