import { useState, useEffect, useRef, useCallback } from "react";

const SYSTEM_PROMPT = `You are APEX — an elite AI daytrading assistant. You are direct, precise, and data-driven. You help traders analyze stocks, identify setups, manage risk, and think through trade decisions.

You can help with:
- Technical analysis (support/resistance, patterns, indicators like RSI, MACD, VWAP, moving averages)
- Risk management (position sizing, stop-loss placement, risk/reward ratios)
- Trade setups and entry/exit strategies
- Reading market conditions (trend, momentum, volume)
- Reviewing trade journals and identifying mistakes
- Psychological discipline and trading rules
- Analyzing chart screenshots and images

When a chart image is provided, analyze it thoroughly:
- Identify the timeframe and instrument if visible
- Note the trend direction and key price action
- Identify key support/resistance levels
- Spot any chart patterns (flags, wedges, head & shoulders, etc.)
- Comment on volume if visible
- Assess indicator readings if present (RSI, MACD, etc.)
- Give a clear trade bias and actionable levels

When analyzing a ticker or setup, be structured:
1. Market context
2. Key levels (support/resistance)
3. Setup quality
4. Entry trigger
5. Stop loss
6. Targets (R multiples)
7. Risk/reward

Always remind users that you are an AI assistant and not a licensed financial advisor. Trades involve real financial risk. Be concise, sharp, and actionable. Use trader terminology naturally.`;

const QUICK_PROMPTS = [
  { label: "📈 Analyze setup", text: "Analyze this setup for me: " },
  { label: "🎯 Find entry", text: "What's the ideal entry for a long position on " },
  { label: "🛡️ Size position", text: "Help me size a position with $10,000 account, 1% risk, entry at $" },
  { label: "📉 Set stop loss", text: "Where should I place my stop loss if I'm long " },
  { label: "🧠 Review trade", text: "Review this trade I took: I bought " },
  { label: "⚡ Scan criteria", text: "What criteria should I scan for to find momentum breakout stocks?" },
];

const MARKET_TICKERS = ["SPY", "QQQ", "AAPL", "TSLA", "NVDA", "AMD", "META", "AMZN"];

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "12px 16px" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#00ff88",
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

function RiskCalc() {
  const [account, setAccount] = useState(10000);
  const [risk, setRisk] = useState(1);
  const [entry, setEntry] = useState(100);
  const [stop, setStop] = useState(97);
  const [target, setTarget] = useState(106);

  const riskDollar = (account * risk) / 100;
  const stopDist = Math.abs(entry - stop);
  const shares = stopDist > 0 ? Math.floor(riskDollar / stopDist) : 0;
  const targetDist = Math.abs(target - entry);
  const rr = stopDist > 0 ? (targetDist / stopDist).toFixed(2) : 0;
  const potentialGain = shares * targetDist;
  const potentialLoss = shares * stopDist;

  const inputStyle = {
    background: "#0a0f1a", border: "1px solid #1a2540", borderRadius: 6,
    color: "#e0e8ff", padding: "6px 10px", fontSize: 13, width: "100%",
    outline: "none", fontFamily: "'JetBrains Mono', monospace",
  };
  const labelStyle = { fontSize: 11, color: "#556080", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Account ($)", val: account, set: setAccount },
          { label: "Risk %", val: risk, set: setRisk },
          { label: "Entry ($)", val: entry, set: setEntry },
          { label: "Stop ($)", val: stop, set: setStop },
          { label: "Target ($)", val: target, set: setTarget },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <div style={labelStyle}>{label}</div>
            <input type="number" value={val} onChange={e => set(parseFloat(e.target.value) || 0)} style={inputStyle} />
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #1a2540", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Shares", value: shares, color: "#e0e8ff" },
          { label: "Risk $", value: `$${potentialLoss.toFixed(2)}`, color: "#ff4466" },
          { label: "Gain $", value: `$${potentialGain.toFixed(2)}`, color: "#00ff88" },
          { label: "R:R", value: `1 : ${rr}`, color: parseFloat(rr) >= 2 ? "#00ff88" : parseFloat(rr) >= 1 ? "#ffaa00" : "#ff4466" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#556080", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeJournal() {
  const [trades, setTrades] = useState([
    { id: 1, ticker: "NVDA", side: "LONG", entry: 875, exit: 891, shares: 10, date: "2026-03-10", notes: "Breakout from consolidation" },
    { id: 2, ticker: "TSLA", side: "SHORT", entry: 185, exit: 178, shares: 20, date: "2026-03-09", notes: "Failed rally at resistance" },
  ]);
  const [form, setForm] = useState({ ticker: "", side: "LONG", entry: "", exit: "", shares: "", notes: "" });

  const addTrade = () => {
    if (!form.ticker || !form.entry || !form.exit || !form.shares) return;
    setTrades(prev => [...prev, { ...form, id: Date.now(), date: new Date().toISOString().split("T")[0], entry: +form.entry, exit: +form.exit, shares: +form.shares }]);
    setForm({ ticker: "", side: "LONG", entry: "", exit: "", shares: "", notes: "" });
  };

  const inputStyle = {
    background: "#0a0f1a", border: "1px solid #1a2540", borderRadius: 6,
    color: "#e0e8ff", padding: "6px 10px", fontSize: 12, width: "100%",
    outline: "none", fontFamily: "'JetBrains Mono', monospace",
  };

  const totalPnl = trades.reduce((sum, t) => {
    const pnl = t.side === "LONG" ? (t.exit - t.entry) * t.shares : (t.entry - t.exit) * t.shares;
    return sum + pnl;
  }, 0);

  const wins = trades.filter(t => {
    const pnl = t.side === "LONG" ? t.exit - t.entry : t.entry - t.exit;
    return pnl > 0;
  }).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#556080", textTransform: "uppercase", letterSpacing: 1 }}>Total P&L</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: totalPnl >= 0 ? "#00ff88" : "#ff4466", fontFamily: "'JetBrains Mono', monospace" }}>
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#556080", textTransform: "uppercase", letterSpacing: 1 }}>Win Rate</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#e0e8ff", fontFamily: "'JetBrains Mono', monospace" }}>
            {trades.length ? Math.round((wins / trades.length) * 100) : 0}%
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#556080", textTransform: "uppercase", letterSpacing: 1 }}>Trades</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#e0e8ff", fontFamily: "'JetBrains Mono', monospace" }}>{trades.length}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflowY: "auto" }}>
        {trades.map(t => {
          const pnl = t.side === "LONG" ? (t.exit - t.entry) * t.shares : (t.entry - t.exit) * t.shares;
          return (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#0a0f1a", borderRadius: 6, border: "1px solid #1a2540" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#e0e8ff" }}>{t.ticker}</span>
                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: t.side === "LONG" ? "#00ff8820" : "#ff446620", color: t.side === "LONG" ? "#00ff88" : "#ff4466" }}>{t.side}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: pnl >= 0 ? "#00ff88" : "#ff4466", fontFamily: "'JetBrains Mono', monospace" }}>
                {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: "1px solid #1a2540", paddingTop: 10 }}>
        <div style={{ fontSize: 11, color: "#556080", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Log Trade</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input placeholder="Ticker" value={form.ticker} onChange={e => setForm(p => ({ ...p, ticker: e.target.value.toUpperCase() }))} style={inputStyle} />
          <select value={form.side} onChange={e => setForm(p => ({ ...p, side: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
          <input placeholder="Entry" type="number" value={form.entry} onChange={e => setForm(p => ({ ...p, entry: e.target.value }))} style={inputStyle} />
          <input placeholder="Exit" type="number" value={form.exit} onChange={e => setForm(p => ({ ...p, exit: e.target.value }))} style={inputStyle} />
          <input placeholder="Shares" type="number" value={form.shares} onChange={e => setForm(p => ({ ...p, shares: e.target.value }))} style={inputStyle} />
          <button onClick={addTrade} style={{ background: "#00ff8820", border: "1px solid #00ff8840", borderRadius: 6, color: "#00ff88", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "6px 10px" }}>
            + LOG
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "**APEX online.** I'm your AI daytrading assistant.\n\nSend me a chart screenshot and I'll break down the setup — or ask me anything about entries, stops, position sizing, and trade reviews.\n\n📎 Upload · 📋 Paste · 🖱️ Drag & drop chart images directly into the chat."
    }
  ]);
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [ticker, setTicker] = useState("SPY");
  const [dragOver, setDragOver] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const handlePaste = (e) => {
      if (activeTab !== "chat") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) processImageFile(file);
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeTab]);

  const processImageFile = (file) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const base64 = dataUrl.split(",")[1];
      const mediaType = file.type;
      setPendingImages(prev => [...prev, { dataUrl, base64, mediaType, name: file.name || "image" }]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e) => {
    Array.from(e.target.files).forEach(processImageFile);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(processImageFile);
  };

  const removeImage = (idx) => setPendingImages(prev => prev.filter((_, i) => i !== idx));

  const sendMessage = useCallback(async (text) => {
    const userText = text !== undefined ? text : input.trim();
    if ((!userText && pendingImages.length === 0) || loading) return;

    const imgSnapshots = [...pendingImages];
    const userMsg = { role: "user", content: userText, images: imgSnapshots.map(img => img.dataUrl) };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setPendingImages([]);
    setLoading(true);

    // Build API content for current message
    const apiContent = [];
    imgSnapshots.forEach(img => {
      apiContent.push({ type: "image", source: { type: "base64", media_type: img.mediaType, data: img.base64 } });
    });
    if (userText) apiContent.push({ type: "text", text: userText });

    // Build full messages history for API
    const apiMessages = newMessages.map((m, i) => {
      if (i === newMessages.length - 1) {
        return { role: "user", content: apiContent };
      }
      if (m.role === "user") {
        const parts = [];
        if (m.images && m.images.length > 0) {
          m.images.forEach(() => parts.push({ type: "text", text: "[chart image]" }));
        }
        if (m.content) parts.push({ type: "text", text: m.content });
        if (parts.length === 0) parts.push({ type: "text", text: "" });
        return { role: "user", content: parts.length === 1 && parts[0].type === "text" ? parts[0].text : parts };
      }
      return { role: m.role, content: m.content };
    });

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "Error getting response.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
  }, [input, messages, loading, pendingImages]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#00ff88">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color:#aab8d8">$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:#0a0f1a;padding:2px 6px;border-radius:4px;color:#ffaa00;font-family:JetBrains Mono,monospace;font-size:12px">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  const tabs = [
    { id: "chat", label: "💬 AI Chat" },
    { id: "risk", label: "🎯 Risk Calc" },
    { id: "journal", label: "📋 Journal" },
  ];

  const canSend = (input.trim() || pendingImages.length > 0) && !loading;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050810; font-family: 'Syne', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a2540; border-radius: 2px; }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .msg-enter { animation: fadeIn 0.3s ease forwards; }
        .quick-btn:hover { background: #00ff8820 !important; border-color: #00ff8860 !important; color: #00ff88 !important; transform: translateY(-1px); }
        .send-btn:hover:not(:disabled) { background: #00dd77 !important; }
        .tab:hover { color: #00ff88 !important; }
        textarea:focus { border-color: #00ff8840 !important; }
        .img-upload-btn:hover { background: #00ff8820 !important; border-color: #00ff8860 !important; color: #00ff88 !important; }
        .remove-img:hover { background: #ff446640 !important; color: #ff4466 !important; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", background: "#050810", color: "#e0e8ff", overflow: "hidden" }}>

        <div style={{ position: "fixed", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,136,0.01) 2px,rgba(0,255,136,0.01) 4px)", pointerEvents: "none", zIndex: 999 }} />

        {/* Sidebar */}
        <div style={{ width: 260, background: "#080d1a", borderRight: "1px solid #1a2540", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #1a2540" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#00ff88,#00aaff)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 20px #00ff8840" }}>⚡</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2, color: "#fff" }}>APEX</div>
                <div style={{ fontSize: 10, color: "#00ff88", letterSpacing: 3, textTransform: "uppercase" }}>AI Trader</div>
              </div>
            </div>
          </div>

          <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a2540" }}>
            <div style={{ fontSize: 10, color: "#556080", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Watchlist</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {MARKET_TICKERS.map(t => (
                <button key={t} onClick={() => { setTicker(t); setInput(`Analyze ${t} for a potential trade setup today`); setActiveTab("chat"); inputRef.current?.focus(); }}
                  style={{ padding: "4px 8px", background: ticker === t ? "#00ff8820" : "#0a0f1a", border: `1px solid ${ticker === t ? "#00ff8840" : "#1a2540"}`, borderRadius: 4, color: ticker === t ? "#00ff88" : "#667090", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Mono', monospace", transition: "all 0.2s" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: "16px 20px", flexGrow: 1, overflowY: "auto" }}>
            <div style={{ fontSize: 10, color: "#556080", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Quick Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} className="quick-btn" onClick={() => { setInput(p.text); setActiveTab("chat"); inputRef.current?.focus(); }}
                  style={{ padding: "9px 12px", background: "#0a0f1a", border: "1px solid #1a2540", borderRadius: 7, color: "#8899bb", fontSize: 12, textAlign: "left", cursor: "pointer", transition: "all 0.2s" }}>
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, color: "#556080", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Chart Analysis</div>
              <button className="img-upload-btn" onClick={() => { setActiveTab("chat"); setTimeout(() => fileInputRef.current?.click(), 50); }}
                style={{ width: "100%", padding: "10px 12px", background: "#0a0f1a", border: "1px dashed #1a2540", borderRadius: 7, color: "#8899bb", fontSize: 12, textAlign: "left", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>📸</span>
                <span>Upload chart image</span>
              </button>
            </div>
          </div>

          <div style={{ padding: 16, borderTop: "1px solid #1a2540" }}>
            <div style={{ fontSize: 10, color: "#334466", lineHeight: 1.5 }}>
              ⚠️ Not financial advice. Trading involves substantial risk of loss. Use at your own discretion.
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "0 24px", borderBottom: "1px solid #1a2540", height: 56 }}>
            {tabs.map(tab => (
              <button key={tab.id} className="tab" onClick={() => setActiveTab(tab.id)}
                style={{ padding: "0 20px", height: "100%", background: "none", border: "none", borderBottom: activeTab === tab.id ? "2px solid #00ff88" : "2px solid transparent", color: activeTab === tab.id ? "#00ff88" : "#556080", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", fontFamily: "'Syne', sans-serif" }}>
                {tab.label}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00ff88", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, color: "#00ff88", fontFamily: "'Space Mono', monospace" }}>LIVE</span>
            </div>
          </div>

          {activeTab === "chat" && (
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
              onDrop={handleDrop}>

              {/* Drag overlay */}
              {dragOver && (
                <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "#050810dd", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", pointerEvents: "none" }}>
                  <div style={{ border: "2px dashed #00ff88", borderRadius: 20, padding: "40px 60px", textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#00ff88" }}>Drop chart to analyze</div>
                    <div style={{ fontSize: 13, color: "#556080", marginTop: 6 }}>APEX will break down the setup</div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div style={{ flexGrow: 1, overflowY: "auto", padding: "24px" }}>
                <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
                  {messages.map((msg, i) => (
                    <div key={i} className="msg-enter" style={{ display: "flex", gap: 14, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                      {msg.role === "assistant" && (
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#00ff88,#00aaff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, boxShadow: "0 0 15px #00ff8830" }}>⚡</div>
                      )}
                      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 8, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                        {/* Images */}
                        {msg.images && msg.images.length > 0 && (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                            {msg.images.map((imgUrl, idx) => (
                              <img key={idx} src={imgUrl} alt="chart" style={{ maxWidth: 300, maxHeight: 220, borderRadius: 10, border: "1px solid #00ff8840", objectFit: "contain", background: "#0a0f1a", cursor: "pointer" }}
                                onClick={() => window.open(imgUrl, "_blank")} />
                            ))}
                          </div>
                        )}
                        {/* Text */}
                        {msg.content && (
                          <div style={{
                            padding: "13px 16px",
                            borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                            background: msg.role === "user" ? "linear-gradient(135deg,#0066cc,#0044aa)" : "#0d1628",
                            border: msg.role === "user" ? "none" : "1px solid #1a2540",
                            fontSize: 14, lineHeight: 1.7, color: "#d0dcf0",
                          }} dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: "#1a2540", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="msg-enter" style={{ display: "flex", gap: 14 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#00ff88,#00aaff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⚡</div>
                      <div style={{ background: "#0d1628", border: "1px solid #1a2540", borderRadius: "16px 16px 16px 4px" }}>
                        <TypingIndicator />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div style={{ padding: "12px 24px 16px", borderTop: "1px solid #1a2540", background: "#080d1a" }}>
                <div style={{ maxWidth: 760, margin: "0 auto" }}>

                  {/* Image previews */}
                  {pendingImages.length > 0 && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", padding: "8px", background: "#0d1628", borderRadius: 10, border: "1px solid #1a2540" }}>
                      {pendingImages.map((img, idx) => (
                        <div key={idx} style={{ position: "relative" }}>
                          <img src={img.dataUrl} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #00ff8840", display: "block" }} />
                          <button className="remove-img" onClick={() => removeImage(idx)}
                            style={{ position: "absolute", top: -7, right: -7, width: 20, height: 20, borderRadius: "50%", background: "#0d1628", border: "1px solid #1a2540", color: "#8899bb", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", lineHeight: 1 }}>
                            ✕
                          </button>
                          <div style={{ fontSize: 9, color: "#556080", textAlign: "center", marginTop: 3, maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {img.name}
                          </div>
                        </div>
                      ))}
                      <div style={{ display: "flex", alignItems: "center", padding: "0 8px", color: "#556080", fontSize: 11 }}>
                        📊 Ready to analyze
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <button className="img-upload-btn" onClick={() => fileInputRef.current?.click()}
                      title="Upload chart image (or paste / drag & drop)"
                      style={{ width: 46, height: 46, background: "#0d1628", border: "1px solid #1a2540", borderRadius: 10, color: "#556080", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}>
                      📎
                    </button>

                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileInput} style={{ display: "none" }} />

                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder={pendingImages.length > 0 ? "Add context about this chart... or just hit send ↑" : "Ask anything, paste a chart (Ctrl+V), or drag & drop an image..."}
                      style={{ flexGrow: 1, background: "#0d1628", border: "1px solid #1a2540", borderRadius: 12, color: "#e0e8ff", padding: "13px 16px", fontSize: 14, resize: "none", outline: "none", fontFamily: "'Syne', sans-serif", lineHeight: 1.5, minHeight: 50, maxHeight: 120, transition: "border-color 0.2s" }}
                      rows={1}
                    />
                    <button className="send-btn" onClick={() => sendMessage()} disabled={!canSend}
                      style={{ width: 46, height: 46, background: "#00ff88", border: "none", borderRadius: 12, color: "#050810", fontSize: 22, fontWeight: 700, cursor: canSend ? "pointer" : "not-allowed", opacity: canSend ? 1 : 0.4, transition: "all 0.2s", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ↑
                    </button>
                  </div>

                  <div style={{ marginTop: 6, fontSize: 11, color: "#334466", display: "flex", gap: 16 }}>
                    <span>Enter to send · Shift+Enter for newline</span>
                    <span style={{ color: "#3a4a6a" }}>📎 Upload · 📋 Ctrl+V paste · 🖱️ Drag & drop</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "risk" && (
            <div style={{ flexGrow: 1, overflowY: "auto", padding: 24, display: "flex", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: 500 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Position Sizer</div>
                  <div style={{ fontSize: 13, color: "#556080" }}>Calculate exact position size based on your risk parameters.</div>
                </div>
                <div style={{ background: "#0d1628", border: "1px solid #1a2540", borderRadius: 14, padding: 24 }}>
                  <RiskCalc />
                </div>
              </div>
            </div>
          )}

          {activeTab === "journal" && (
            <div style={{ flexGrow: 1, overflowY: "auto", padding: 24, display: "flex", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: 600 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Trade Journal</div>
                  <div style={{ fontSize: 13, color: "#556080" }}>Track every trade. Review your edge over time.</div>
                </div>
                <div style={{ background: "#0d1628", border: "1px solid #1a2540", borderRadius: 14, padding: 24 }}>
                  <TradeJournal />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
