import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Award, Sparkles } from 'lucide-react';
import BadgeShowcase from '@/components/shared/BadgeShowcase';

const Achievements = () => {
  const { user, roles } = useAuth();

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-yellow-200" /> Hệ thống Thành tích & Danh hiệu
          </div>
          <h1 className="text-2xl md:text-4xl font-black">Bộ Sưu Tập Danh Hiệu Rạng Rỡ</h1>
          <p className="text-sm md:text-base text-white/90 max-w-2xl leading-relaxed">
            Tích lũy XP, duy trì chuỗi học tập liên tục và hoàn thành các bài thi/bài tập để mở khóa các huy hiệu danh giá!
          </p>
        </div>
        <Award className="absolute -right-6 -bottom-6 w-56 h-56 text-white/10 rotate-12 pointer-events-none" />
      </div>

      {/* Main Dynamic Showcase */}
      {user && (
        <BadgeShowcase userId={user.id} role={roles[0] || 'student'} />
      )}
    </div>
  );
};

export default Achievements;
