bash

cat /home/claude/kakeibo/pages/index.js | sed 's/const USERS = \["自分", "嫁"\];/const USERS = ["瞬", "香琳"];/' | sed 's/u === "自分" ? "👤" : "👰"/u === "瞬" ? "👤" : "👰"/' | sed 's/{user === "自分" ? "👤" : "👰"}/{user === "瞬" ? "👤" : "👰"}/'
出力

import { useState, useRef, useCallback } from "react";
import Head from "next/head";

const CATEGORIES = [
  { label: "🍚 食費・外食", key: "食費・外食", subs: ["食費", "外食・テイクアウト", "食料品"] },
  { label: "💡 光熱費・通信費", key: "光熱費・通信費", subs: ["電気代", "ガス代", "水道代", "スマホ・通信費", "インターネット"] },
  { label: "🚃 交通費", key: "交通費", subs: ["電車・バス", "タクシー", "ガソリン", "駐車場"] },
  { label: "💊 医療・美容", key: "医療・美容", subs: ["病院・薬局", "美容院・理容", "化粧品・スキンケア"] },
  { label: "🎮 娯楽・趣味", key: "娯楽・趣味", subs: ["映画・音楽・書籍", "旅行・レジャー", "スポーツ・ジム", "趣味用品"] },
  { label: "👕 日用品・衣類", key: "日用品・衣類", subs: ["日用消耗品", "衣類・靴", "家電・家具"] },
  { label: "📚 教育・保険", key: "教育・保険", subs: ["学費・教材", "保険料", "習い事"] },
];

const USERS = ["瞬", "香琳"];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("scan");
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(URL.createObjectURL(file));
    setEditData(null);
    setError(null);
    setSaved(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target.result.split(",")[1];
      setImageBase64(b64);
    };
    reader.readAsDataURL(file);
  }, []);

  const scan = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setEditData({ ...json.data, date: json.data.date || todayStr() });
    } catch (e) {
      setError(e.message || "読み取りに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!editData || !user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, entry: editData }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setSaved(json.sheet);
      setEditData(null);
      setImage(null);
      setImageBase64(null);
    } catch (e) {
      setError(e.message || "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const currentCat = CATEGORIES.find((c) => c.key === editData?.category) || CATEGORIES[0];

  // ユーザー選択画面
  if (!user) {
    return (
      <>
        <Head><title>家計簿アプリ</title></Head>
        <div style={s.app}>
          <div style={s.userSelect}>
            <div style={s.logo}>💰</div>
            <h1 style={s.title}>家計簿アプリ</h1>
            <p style={s.subtitle}>入力する人を選んでください</p>
            <div style={s.userBtns}>
              {USERS.map((u) => (
                <button key={u} style={s.userBtn} onClick={() => setUser(u)}>
                  <span style={s.userIcon}>{u === "瞬" ? "👤" : "👰"}</span>
                  <span style={s.userName}>{u}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>家計簿 — {user}</title></Head>
      <div style={s.app}>
        {/* ヘッダー */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <span style={s.headerIcon}>{user === "瞬" ? "👤" : "👰"}</span>
            <span style={s.headerUser}>{user}</span>
          </div>
          <h1 style={s.headerTitle}>💰 家計簿</h1>
          <button style={s.switchBtn} onClick={() => { setUser(null); setEditData(null); setImage(null); setError(null); setSaved(null); }}>
            切替
          </button>
        </div>

        {/* タブ */}
        <div style={s.tabBar}>
          {[["scan", "📷 スキャン"], ["manual", "✏️ 手入力"]].map(([k, l]) => (
            <button key={k} style={{ ...s.tab, ...(tab === k ? s.tabActive : {}) }} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </div>

        {/* 保存成功バナー */}
        {saved && (
          <div style={s.successBanner}>
            ✅ Googleスプレッドシートに保存しました！<br />
            <span style={{ fontSize: 12, opacity: 0.8 }}>シート: {saved}</span>
          </div>
        )}

        {/* スキャンタブ */}
        {tab === "scan" && (
          <div>
            <div style={s.card}>
              <div style={s.cardTitle}>📸 レシートをアップロード</div>
              {!image ? (
                <div
                  style={{ ...s.uploadZone, ...(dragOver ? s.uploadZoneHover : {}) }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                  onClick={() => fileRef.current.click()}
                >
                  <input ref={fileRef} type="file" accept="image/*" capture="environment"
                    style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                  <div style={s.uploadText}>
                    <strong>タップして写真を選択</strong><br />
                    またはカメラで撮影
                  </div>
                </div>
              ) : (
                <div>
                  <img src={image} alt="receipt" style={s.previewImg} />
                  <div style={s.btnRow}>
                    <button style={s.btnOutline} onClick={() => { setImage(null); setImageBase64(null); setEditData(null); }}>
                      🔄 撮り直す
                    </button>
                    <button style={{ ...s.btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={scan} disabled={loading}>
                      {loading ? "⏳ 解析中..." : "🔍 AIで読み取る"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && <div style={s.errorBox}>⚠️ {error}</div>}

            {editData && !loading && <EntryForm data={editData} setData={setEditData} cats={CATEGORIES} currentCat={currentCat} saving={saving} onSave={save} />}
          </div>
        )}

        {/* 手入力タブ */}
        {tab === "manual" && (
          <div>
            {!editData ? (
              <div style={s.card}>
                <div style={s.cardTitle}>✏️ 支出を手入力</div>
                <button style={s.btnPrimary} onClick={() => setEditData({
                  store: "", date: todayStr(), total: 0,
                  category: "食費・外食", subcategory: "食費", items: [], memo: ""
                })}>
                  ＋ 新規入力
                </button>
              </div>
            ) : (
              <>
                {error && <div style={s.errorBox}>⚠️ {error}</div>}
                <EntryForm data={editData} setData={setEditData} cats={CATEGORIES} currentCat={currentCat} saving={saving} onSave={save} />
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function EntryForm({ data, setData, cats, currentCat, saving, onSave }) {
  return (
    <div style={s.card}>
      <div style={{ ...s.cardTitle, justifyContent: "space-between" }}>
        ✏️ 内容を確認・編集
        <span style={s.badge}>✓ 確認してください</span>
      </div>

      <Field label="店名">
        <input style={s.input} value={data.store || ""} onChange={(e) => setData({ ...data, store: e.target.value })} placeholder="例：イオン" />
      </Field>

      <Field label="日付">
        <input style={s.input} type="date" value={data.date || ""} onChange={(e) => setData({ ...data, date: e.target.value })} />
      </Field>

      <Field label="カテゴリ">
        <select style={s.input} value={data.category || ""} onChange={(e) => setData({ ...data, category: e.target.value, subcategory: "" })}>
          {cats.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </Field>

      <Field label="サブカテゴリ">
        <select style={s.input} value={data.subcategory || ""} onChange={(e) => setData({ ...data, subcategory: e.target.value })}>
          {currentCat.subs.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>

      <Field label="合計金額（円）">
        <input style={{ ...s.input, fontSize: 20, fontWeight: 700, textAlign: "right", color: "#1a4a2e" }}
          type="number" value={data.total || 0} onChange={(e) => setData({ ...data, total: Number(e.target.value) })} />
      </Field>

      <Field label="メモ（任意）">
        <input style={s.input} value={data.memo || ""} onChange={(e) => setData({ ...data, memo: e.target.value })} placeholder="任意" />
      </Field>

      {data.items?.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={s.fieldLabel}>品目</div>
          {data.items.map((item, i) => (
            <div key={i} style={s.itemRow}>
              <span style={{ fontSize: 13 }}>{item.name}</span>
              <span style={{ fontFamily: "monospace", fontSize: 13 }}>¥{Number(item.price).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      <button style={{ ...s.btnPrimary, marginTop: 20, opacity: saving ? 0.6 : 1 }} onClick={onSave} disabled={saving}>
        {saving ? "⏳ 保存中..." : "💾 Googleスプレッドシートに保存"}
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={s.fieldLabel}>{label}</div>
      {children}
    </div>
  );
}

const s = {
  app: { fontFamily: "'Helvetica Neue', Arial, 'Hiragino Sans', 'Yu Gothic', sans-serif", minHeight: "100vh", background: "linear-gradient(135deg,#e8f5ee,#f5faf7)", padding: "16px", maxWidth: 480, margin: "0 auto" },
  userSelect: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16 },
  logo: { fontSize: 60 },
  title: { fontSize: 28, fontWeight: 800, color: "#1a4a2e" },
  subtitle: { fontSize: 14, color: "#5a8a6e" },
  userBtns: { display: "flex", gap: 16, marginTop: 8 },
  userBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "24px 32px", background: "white", border: "2px solid #d0e8d8", borderRadius: 20, cursor: "pointer", boxShadow: "0 4px 16px rgba(30,90,60,0.08)", fontSize: 14, fontWeight: 700, color: "#1a4a2e" },
  userIcon: { fontSize: 36 },
  userName: { fontSize: 16, fontWeight: 700 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  headerLeft: { display: "flex", alignItems: "center", gap: 6 },
  headerIcon: { fontSize: 20 },
  headerUser: { fontSize: 14, fontWeight: 700, color: "#2d7d52" },
  headerTitle: { fontSize: 18, fontWeight: 800, color: "#1a4a2e" },
  switchBtn: { fontSize: 12, padding: "6px 12px", background: "white", border: "1.5px solid #d0e8d8", borderRadius: 8, cursor: "pointer", color: "#2d7d52", fontWeight: 700 },
  tabBar: { display: "flex", background: "#eef5f1", borderRadius: 12, padding: 4, gap: 4, marginBottom: 16 },
  tab: { flex: 1, padding: "8px 0", border: "none", borderRadius: 8, background: "transparent", fontSize: 13, fontWeight: 700, color: "#5a8a6e", cursor: "pointer" },
  tabActive: { background: "white", color: "#1a4a2e", boxShadow: "0 2px 8px rgba(30,90,60,0.12)" },
  card: { background: "white", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "0 4px 20px rgba(30,90,60,0.08)" },
  cardTitle: { fontSize: 13, fontWeight: 800, color: "#1a4a2e", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 },
  uploadZone: { border: "2px dashed #a8d5b8", borderRadius: 14, padding: "36px 20px", textAlign: "center", cursor: "pointer", background: "#f8fdf9" },
  uploadZoneHover: { borderColor: "#2d7d52", background: "#eef8f2" },
  uploadText: { color: "#4a7a5e", fontSize: 14, lineHeight: 1.7 },
  previewImg: { width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 12, marginBottom: 14, background: "#f0f0f0" },
  btnRow: { display: "flex", gap: 10 },
  btnPrimary: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 20px", background: "linear-gradient(135deg,#2d7d52,#1f5c3a)", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", width: "100%" },
  btnOutline: { flex: 1, padding: "13px 20px", background: "transparent", color: "#2d7d52", border: "2px solid #2d7d52", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer" },
  fieldLabel: { fontSize: 11, fontWeight: 700, color: "#5a8a6e", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  input: { width: "100%", padding: "10px 14px", border: "1.5px solid #d0e8d8", borderRadius: 10, fontSize: 14, color: "#1a4a2e", background: "#f8fdf9", outline: "none", boxSizing: "border-box" },
  itemRow: { display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "#f0f8f4", borderRadius: 8, marginBottom: 4 },
  badge: { fontSize: 10, fontWeight: 700, background: "#e0f5ea", color: "#1a6a3a", padding: "3px 8px", borderRadius: 20 },
  successBanner: { background: "#d4f5e2", border: "1px solid #a0d8b8", color: "#1a4a2e", borderRadius: 14, padding: "14px 16px", marginBottom: 14, fontSize: 14, fontWeight: 700, lineHeight: 1.6 },
  errorBox: { background: "#fef0f0", border: "1px solid #f0b0b0", color: "#8a1a1a", borderRadius: 12, padding: "12px 16px", marginBottom: 12, fontSize: 13 },
};
