"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// 打刻データの型
type TimeRecord = {
  id: number;
  user_id: string;
  type: string;
  created_at: string;
};

//  新しく追加：社員名簿の型
type Profile = {
  id: string;
  name: string;
  employee_id: string;
};

export default function AdminHome() {
  const [records, setRecords] = useState<TimeRecord[]>([]);
  //  新しく追加：名簿データを保存する場所
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchAllRecords = useCallback(async () => {
    setLoading(true);
    
    // 1. 打刻データを取得
    const { data: recordsData, error: recordsError } = await supabase
      .from("time_records")
      .select("*")
      .order("created_at", { ascending: false });

    if (!recordsError) {
      setRecords(recordsData || []);
    } else {
      console.error("打刻データ取得エラー:", recordsError);
    }

    //  2. 社員名簿データを取得して、使いやすいように整理する
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (!profilesError && profilesData) {
      // ユーザーIDを「キー」にして、すぐにプロフィールを引き出すためのマップを作る
      const profileMap: Record<string, Profile> = {};
      profilesData.forEach((p) => {
        profileMap[p.id] = p;
      });
      setProfiles(profileMap);
    } else {
      console.error("名簿データ取得エラー:", profilesError);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
        return;
      }
      fetchAllRecords();
    };

    const timer = setTimeout(() => {
      checkAuthAndFetch();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAllRecords, router]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", 
    });
  };

  // データを「社員（user_id）ごと」にグループ化
  const groupedRecords = records.reduce((acc, record) => {
    if (!acc[record.user_id]) acc[record.user_id] = [];
    acc[record.user_id].push(record);
    return acc;
  }, {} as Record<string, TimeRecord[]>);

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* ヘッダー部分 */}
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              管理者ダッシュボード
            </h1>
            <p className="text-gray-500 text-sm mt-1">全社員の打刻状況をカードで管理しています</p>
          </div>
          <button 
            onClick={fetchAllRecords}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm text-sm font-bold transition-colors"
          >
             最新情報を取得
          </button>
        </div>
        
        {/* カード一覧部分 */}
        {loading ? (
          <p className="text-center text-gray-500 py-10 font-bold bg-white rounded-xl shadow-sm">データを読み込み中...</p>
        ) : Object.keys(groupedRecords).length === 0 ? (
          <p className="text-center text-gray-500 py-10 font-bold bg-white rounded-xl shadow-sm">打刻データがありません</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(groupedRecords).map(([userId, userRecords]) => {
              const userProfile = profiles[userId];
              const userName = userProfile?.name || "未登録ユーザー";
              const employeeId = userProfile?.employee_id || "---";
              
              // 名前の1文字目をアイコンにする（未登録の場合はIDの先頭2文字）
              const iconText = userProfile?.name ? userName.substring(0, 1) : userId.substring(0, 2).toUpperCase();

              return (
                <div key={userId} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                  
                  {/* カードのヘッダー（社員情報） */}
                  <div className="bg-slate-800 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white font-bold">
                        {iconText}
                      </div>
                      <div>
                        <h2 className="text-white font-bold text-lg leading-tight">
                          {userName}
                        </h2>
                        <p className="text-slate-400 text-xs font-mono mt-0.5">
                          社員番号: {employeeId}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 打刻履歴のリスト */}
                  <div className="p-0">
                    <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                      {userRecords.map((record) => (
                        <li key={record.id} className="p-4 hover:bg-gray-50 flex justify-between items-center transition-colors">
                          <span className={`px-3 py-1 rounded text-xs font-bold ${record.type === '出勤' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                            {record.type}
                          </span>
                          <span className="text-gray-600 font-mono text-sm">
                            {formatTime(record.created_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-3 text-right border-t border-gray-100">
                    <span className="text-xs text-gray-400 font-bold">
                      計 {userRecords.length} 件の打刻
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}