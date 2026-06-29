"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

type TimeRecord = {
  id: number;
  user_id: string;
  type: string;
  created_at: string;
};

export default function Home() {
  // --- ユーザー認証用の状態 ---
  const [user, setUser] = useState<User | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // --- 打刻機能用の状態 ---
  const [message, setMessage] = useState("");
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!user) return; // ログインしてない時は何もしない

    const { data, error } = await supabase
      .from("time_records")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setRecords(data || []);
  }, [user]); // userの中身が変わった時だけ関数を作り直す設定

  // ① 画面が開いたときに、ログイン状態をチェックする
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();
  }, []);

  // ② ログインしている時だけ、時計を動かして履歴を取得する
  useEffect(() => {
    if (user) {
      // データの取得
      const loadData = async () => {
        await fetchRecords();
      };
      loadData();

      // ★ cascading renders エラーを防ぐための時計設定
      const initTimer = setTimeout(() => setCurrentTime(new Date()), 0);
      const intervalTimer = setInterval(() => setCurrentTime(new Date()), 1000);

      return () => {
        clearTimeout(initTimer);
        clearInterval(intervalTimer);
      };
    }
  }, [user, fetchRecords]);

  // --- 認証機能のプログラム ---
  const handleAuth = async (isSignUp: boolean) => {
    setAuthMessage("");
    const dummyEmail = `${employeeId}@example.com`;

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: dummyEmail,
        password: password,
      });
      if (error) {
        setAuthMessage("登録エラー: " + error.message);
      } else {
        setAuthMessage("登録完了！そのままログインします...");
        setUser(data.user);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: password,
      });
      if (error) {
        setAuthMessage("ログイン失敗。社員番号かパスワードが違います。");
      } else {
        setUser(data.user);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRecords([]);
    setEmployeeId("");
    setPassword("");
  };

  // --- 打刻のプログラム ---
  const handleRecord = async (recordType: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("time_records")
      .insert([{ user_id: user.id, type: recordType }]);

    if (error) {
      setMessage("エラーが発生しました。");
    } else {
      setMessage(`【完了】${recordType}を記録しました！`);
      setTimeout(() => setMessage(""), 3000);
      fetchRecords(); 
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  };

  // ==========================================
  // 画面の表示
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-10">
        <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">社員ログイン</h1>
          
          <input
            type="text"
            placeholder="社員番号 (例: 123456)"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full mb-4 p-3 border rounded bg-gray-50 focus:outline-blue-500"
          />
          <input
            type="password"
            placeholder="パスワード (6文字以上)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-6 p-3 border rounded bg-gray-50 focus:outline-blue-500"
          />
          
          <div className="flex flex-col gap-3">
            <button onClick={() => handleAuth(false)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors">
              ログイン
            </button>
            <button onClick={() => handleAuth(true)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded transition-colors">
              はじめての登録はこちら
            </button>
          </div>
          
          {authMessage && <p className="text-red-500 mt-4 text-sm font-bold">{authMessage}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <div className="w-full max-w-md flex justify-end mb-4">
        <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900 underline">
          ログアウト
        </button>
      </div>

      <div className="bg-white p-10 rounded-xl shadow-lg text-center w-full max-w-md mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">勤怠打刻システム</h1>
        <p className="text-gray-500 mb-6 font-mono">ID: {employeeId}</p>
        
        <div className="text-5xl font-mono font-bold text-gray-700 mb-8 bg-gray-50 py-4 rounded-lg border">
          {currentTime ? currentTime.toLocaleTimeString("ja-JP") : "..."}
        </div>
        
        <div className="flex gap-6 justify-center mb-6">
          <button onClick={() => handleRecord("出勤")} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-10 rounded-lg text-xl shadow-md transition-colors">出勤</button>
          <button onClick={() => handleRecord("退勤")} className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-10 rounded-lg text-xl shadow-md transition-colors">退勤</button>
        </div>
        <div className="h-6"><p className="text-green-600 font-bold">{message}</p></div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">あなたの打刻履歴</h2>
        {records.length === 0 ? (
          <p className="text-gray-500 text-center py-4">履歴がありません</p>
        ) : (
          <ul className="space-y-3">
            {records.map((record) => (
              <li key={record.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
                <span className={`font-bold px-3 py-1 rounded text-sm ${record.type === '出勤' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{record.type}</span>
                <span className="text-gray-600 font-mono">{formatTime(record.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}