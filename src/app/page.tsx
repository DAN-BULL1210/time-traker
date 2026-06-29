"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  // 画面にメッセージを表示するための準備
  const [message, setMessage] = useState("");

  // 打刻ボタンを押した時に動くプログラム
  const handleRecord = async (recordType: string) => {
    // ※今はまだログイン機能がないので、仮のユーザーIDを使います
    const dummyUserId = "TEST-USER-001";

    // Supabaseの「time_records」テーブルにデータを送信！
    const { error } = await supabase
      .from("time_records")
      .insert([{ user_id: dummyUserId, type: recordType }]);

    // エラーが起きたかどうかの判定
    if (error) {
      console.error(error);
      setMessage("エラーが発生しました。");
    } else {
      setMessage(`【完了】${recordType}を記録しました！`);
      
      // 3秒後にメッセージを消す
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">勤怠打刻システム</h1>
        
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

        {/* メッセージを表示する場所 */}
        <div className="h-6">
          <p className="text-green-600 font-bold">{message}</p>
        </div>
        
      </div>
    </div>
  );
}