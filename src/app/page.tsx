"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// データベースから取得するデータの型（TypeScriptの設計図）
type TimeRecord = {
  id: number;
  user_id: string;
  type: string;
  created_at: string;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // ① リアルタイム時計：1秒ごとに現在時刻を更新する
  useEffect(() => {
    setCurrentTime(new Date()); // 最初の一回
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer); // 画面を閉じた時にお掃除する
  }, []);

  // ② 画面が開いた時に、Supabaseから打刻履歴を読み込む
  useEffect(() => {
    fetchRecords();
  }, []);

  // 履歴をSupabaseから取得する関数
  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("time_records")
      .select("*")
      .order("created_at", { ascending: false }); // 新しい順（降順）に並び替え

    if (error) {
      console.error("取得エラー:", error);
    } else {
      setRecords(data || []);
    }
  };

  // 打刻ボタンを押した時の処理
  const handleRecord = async (recordType: string) => {
    const dummyUserId = "TEST-USER-001";

    const { error } = await supabase
      .from("time_records")
      .insert([{ user_id: dummyUserId, type: recordType }]);

    if (error) {
      console.error(error);
      setMessage("エラーが発生しました。");
    } else {
      setMessage(`【完了】${recordType}を記録しました！`);
      setTimeout(() => setMessage(""), 3000);
      
      // ★打刻が成功したら、リストを最新状態に再読み込みする！
      fetchRecords();
    }
  };

  // GMTの時間を、日本時間で見やすくフォーマットする関数
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      
      {/* 打刻パネル */}
      <div className="bg-white p-10 rounded-xl shadow-lg text-center w-full max-w-md mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">勤怠打刻システム</h1>
        
        {/* デジタル時計の表示 */}
        <div className="text-5xl font-mono font-bold text-gray-700 mb-8 bg-gray-50 py-4 rounded-lg border">
          {currentTime ? currentTime.toLocaleTimeString("ja-JP") : "..."}
        </div>
        
        <div className="flex gap-6 justify-center mb-6">
          <button 
            onClick={() => handleRecord("出勤")}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-10 rounded-lg text-xl shadow-md transition-colors"
          >
            出勤
          </button>
          
          <button 
            onClick={() => handleRecord("退勤")}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-10 rounded-lg text-xl shadow-md transition-colors"
          >
            退勤
          </button>
        </div>

        <div className="h-6">
          <p className="text-green-600 font-bold">{message}</p>
        </div>
      </div>

      {/* 履歴リストパネル */}
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">今日の打刻履歴</h2>
        
        {records.length === 0 ? (
          <p className="text-gray-500 text-center py-4">履歴がありません</p>
        ) : (
          <ul className="space-y-3">
            {records.map((record) => (
              <li key={record.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
                <span className={`font-bold px-3 py-1 rounded text-sm ${record.type === '出勤' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                  {record.type}
                </span>
                <span className="text-gray-600 font-mono">
                  {formatTime(record.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}