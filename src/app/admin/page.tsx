"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type TimeRecord = {
  id: number;
  user_id: string;
  type: string;
  created_at: string;
};

//  雇用形態（employment_type）を追加
type Profile = {
  id: string;
  name: string;
  employee_id: string;
  employment_type?: string; 
};

export default function AdminHome() {
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchAllRecords = useCallback(async () => {
    setLoading(true);
    const { data: recordsData, error: recordsError } = await supabase
      .from("time_records")
      .select("*")
      .order("created_at", { ascending: false });

    if (!recordsError) setRecords(recordsData || []);

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (!profilesError && profilesData) {
      const profileMap: Record<string, Profile> = {};
      profilesData.forEach((p) => {
        profileMap[p.id] = p;
      });
      setProfiles(profileMap);
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
    const timer = setTimeout(() => checkAuthAndFetch(), 0);
    return () => clearTimeout(timer);
  }, [fetchAllRecords, router]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", 
    });
  };

  const groupedRecords = records.reduce((acc, record) => {
    if (!acc[record.user_id]) acc[record.user_id] = [];
    acc[record.user_id].push(record);
    return acc;
  }, {} as Record<string, TimeRecord[]>);

  //  雇用形態によってヘッダーの色を変える関数
  const getHeaderColor = (type?: string) => {
    switch (type) {
      case "正社員":
        return "bg-blue-700"; 
      case "契約社員":
        return "bg-teal-600"; 
      case "アルバイト":
        return "bg-orange-500"; 
      default:
        return "bg-slate-700"; 
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        
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
            🔄 最新情報を取得
          </button>
        </div>
        
        {loading ? (
          <p className="text-center text-gray-500 py-10 font-bold bg-white rounded-xl shadow-sm">データを読み込み中...</p>
        ) : Object.keys(groupedRecords).length === 0 ? (
          <p className="text-center text-gray-500 py-10 font-bold bg-white rounded-xl shadow-sm">打刻データがありません</p>
        ) : (
          /*  グリッドの変更 最小幅で2列(grid-cols-2)、中画面で3列(md:grid-cols-3)、最大幅で4列(lg:grid-cols-4) */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Object.entries(groupedRecords).map(([userId, userRecords]) => {
              const userProfile = profiles[userId];
              const userName = userProfile?.name || "未登録ユーザー";
              const employeeId = userProfile?.employee_id || "---";
              const empType = userProfile?.employment_type || "未設定";
              
              const iconText = userProfile?.name ? userName.substring(0, 1) : userId.substring(0, 2).toUpperCase();
              
              // ヘッダーの背景色を取得
              const headerColorClass = getHeaderColor(userProfile?.employment_type);

              return (
                <div key={userId} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col h-full">
                  
                  {/*  カードのヘッダー（動的に色が変わる） */}
                  <div className={`${headerColorClass} p-3 md:p-4 transition-colors`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                        {iconText}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-white font-bold text-sm md:text-base leading-tight truncate">
                          {userName}
                        </h2>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-white/80 text-[10px] md:text-xs font-mono">
                            ID:{employeeId}
                          </span>
                          {/* 雇用形態のバッジ */}
                          <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded">
                            {empType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 打刻履歴のリスト */}
                  <div className="p-0 flex-grow">
                    <ul className="divide-y divide-gray-100 max-h-48 md:max-h-64 overflow-y-auto">
                      {userRecords.map((record) => (
                        <li key={record.id} className="p-3 hover:bg-gray-50 flex justify-between items-center transition-colors">
                          <span className={`px-2 py-1 rounded text-[10px] md:text-xs font-bold ${record.type === '出勤' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                            {record.type}
                          </span>
                          <span className="text-gray-600 font-mono text-[10px] md:text-xs">
                            {formatTime(record.created_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-2 md:p-3 text-right border-t border-gray-100 mt-auto">
                    <span className="text-[10px] md:text-xs text-gray-400 font-bold">
                      計 {userRecords.length} 件
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