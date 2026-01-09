import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import PomodoroTimer from "./PomodoroTimer.jsx";

function Success() {
  useEffect(() => {
    // テスト用：支払い完了ページに来たらPro化
    localStorage.setItem("isPro", "true");
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>✅ お支払い完了</h2>
      <p>Proを有効化しました（いまはテスト用）。</p>
      <a href="/">トップへ戻る</a>
    </div>
  );
}

function Cancel() {
  return (
    <div style={{ padding: 24 }}>
      <h2>↩️ キャンセルしました</h2>
      <a href="/">トップへ戻る</a>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PomodoroTimer />} />
      <Route path="/success" element={<Success />} />
      <Route path="/cancel" element={<Cancel />} />
    </Routes>
  );
}
