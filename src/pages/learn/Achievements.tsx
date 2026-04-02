import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Flame, 
  BookOpen, 
  Star, 
  Target, 
  Zap,
  Award,
  Crown,
  Medal,
  Gem,
  Heart,
  Sparkles
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  requirement: number;
  current: number;
  unlocked: boolean;
  category: 'streak' | 'lessons' | 'xp' | 'vocabulary';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const Achievements = () => {
  const { user } = useAuth();

  const { data: progress } = useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: completedLessons } = useQuery({
    queryKey: ['completed-lessons-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('completed_lessons')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const achievements: Achievement[] = [
    // Streak achievements
    {
      id: 'streak-3',
      title: 'Khởi đầu tốt đẹp',
      description: 'Học liên tục 3 ngày',
      icon: <Flame className="w-6 h-6" />,
      requirement: 3,
      current: progress?.streak || 0,
      unlocked: (progress?.streak || 0) >= 3,
      category: 'streak',
      rarity: 'common',
    },
    {
      id: 'streak-7',
      title: 'Tuần lễ chăm chỉ',
      description: 'Học liên tục 7 ngày',
      icon: <Flame className="w-6 h-6" />,
      requirement: 7,
      current: progress?.streak || 0,
      unlocked: (progress?.streak || 0) >= 7,
      category: 'streak',
      rarity: 'rare',
    },
    {
      id: 'streak-30',
      title: 'Tháng kiên trì',
      description: 'Học liên tục 30 ngày',
      icon: <Flame className="w-6 h-6" />,
      requirement: 30,
      current: progress?.streak || 0,
      unlocked: (progress?.streak || 0) >= 30,
      category: 'streak',
      rarity: 'epic',
    },
    {
      id: 'streak-100',
      title: 'Huyền thoại bền bỉ',
      description: 'Học liên tục 100 ngày',
      icon: <Crown className="w-6 h-6" />,
      requirement: 100,
      current: progress?.streak || 0,
      unlocked: (progress?.streak || 0) >= 100,
      category: 'streak',
      rarity: 'legendary',
    },
    // Lessons achievements
    {
      id: 'lessons-1',
      title: 'Bước đầu tiên',
      description: 'Hoàn thành 1 bài học',
      icon: <BookOpen className="w-6 h-6" />,
      requirement: 1,
      current: completedLessons || 0,
      unlocked: (completedLessons || 0) >= 1,
      category: 'lessons',
      rarity: 'common',
    },
    {
      id: 'lessons-10',
      title: 'Học sinh chăm chỉ',
      description: 'Hoàn thành 10 bài học',
      icon: <BookOpen className="w-6 h-6" />,
      requirement: 10,
      current: completedLessons || 0,
      unlocked: (completedLessons || 0) >= 10,
      category: 'lessons',
      rarity: 'rare',
    },
    {
      id: 'lessons-50',
      title: 'Nhà học thuật',
      description: 'Hoàn thành 50 bài học',
      icon: <Award className="w-6 h-6" />,
      requirement: 50,
      current: completedLessons || 0,
      unlocked: (completedLessons || 0) >= 50,
      category: 'lessons',
      rarity: 'epic',
    },
    {
      id: 'lessons-100',
      title: 'Bậc thầy ngôn ngữ',
      description: 'Hoàn thành 100 bài học',
      icon: <Trophy className="w-6 h-6" />,
      requirement: 100,
      current: completedLessons || 0,
      unlocked: (completedLessons || 0) >= 100,
      category: 'lessons',
      rarity: 'legendary',
    },
    // XP achievements
    {
      id: 'xp-100',
      title: 'Người mới bắt đầu',
      description: 'Đạt 100 XP',
      icon: <Star className="w-6 h-6" />,
      requirement: 100,
      current: progress?.total_xp || 0,
      unlocked: (progress?.total_xp || 0) >= 100,
      category: 'xp',
      rarity: 'common',
    },
    {
      id: 'xp-500',
      title: 'Ngôi sao đang lên',
      description: 'Đạt 500 XP',
      icon: <Zap className="w-6 h-6" />,
      requirement: 500,
      current: progress?.total_xp || 0,
      unlocked: (progress?.total_xp || 0) >= 500,
      category: 'xp',
      rarity: 'rare',
    },
    {
      id: 'xp-2000',
      title: 'Chiến binh ngôn ngữ',
      description: 'Đạt 2000 XP',
      icon: <Medal className="w-6 h-6" />,
      requirement: 2000,
      current: progress?.total_xp || 0,
      unlocked: (progress?.total_xp || 0) >= 2000,
      category: 'xp',
      rarity: 'epic',
    },
    {
      id: 'xp-10000',
      title: 'Huyền thoại XP',
      description: 'Đạt 10000 XP',
      icon: <Gem className="w-6 h-6" />,
      requirement: 10000,
      current: progress?.total_xp || 0,
      unlocked: (progress?.total_xp || 0) >= 10000,
      category: 'xp',
      rarity: 'legendary',
    },
    // Vocabulary achievements
    {
      id: 'vocab-10',
      title: 'Bộ sưu tập từ',
      description: 'Học thuộc 10 từ vựng',
      icon: <Target className="w-6 h-6" />,
      requirement: 10,
      current: progress?.vocabulary_mastered || 0,
      unlocked: (progress?.vocabulary_mastered || 0) >= 10,
      category: 'vocabulary',
      rarity: 'common',
    },
    {
      id: 'vocab-50',
      title: 'Kho từ vựng',
      description: 'Học thuộc 50 từ vựng',
      icon: <Target className="w-6 h-6" />,
      requirement: 50,
      current: progress?.vocabulary_mastered || 0,
      unlocked: (progress?.vocabulary_mastered || 0) >= 50,
      category: 'vocabulary',
      rarity: 'rare',
    },
    {
      id: 'vocab-200',
      title: 'Từ điển sống',
      description: 'Học thuộc 200 từ vựng',
      icon: <Heart className="w-6 h-6" />,
      requirement: 200,
      current: progress?.vocabulary_mastered || 0,
      unlocked: (progress?.vocabulary_mastered || 0) >= 200,
      category: 'vocabulary',
      rarity: 'epic',
    },
    {
      id: 'vocab-500',
      title: 'Bậc thầy từ vựng',
      description: 'Học thuộc 500 từ vựng',
      icon: <Crown className="w-6 h-6" />,
      requirement: 500,
      current: progress?.vocabulary_mastered || 0,
      unlocked: (progress?.vocabulary_mastered || 0) >= 500,
      category: 'vocabulary',
      rarity: 'legendary',
    },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-slate-500/10 text-slate-600 border-slate-500/30';
      case 'rare':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'epic':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
      case 'legendary':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'from-slate-400 to-slate-600';
      case 'rare':
        return 'from-blue-400 to-blue-600';
      case 'epic':
        return 'from-purple-400 to-purple-600';
      case 'legendary':
        return 'from-amber-400 via-yellow-500 to-amber-600';
      default:
        return 'from-primary to-primary/70';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'Thường';
      case 'rare':
        return 'Hiếm';
      case 'epic':
        return 'Sử thi';
      case 'legendary':
        return 'Huyền thoại';
      default:
        return rarity;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'streak':
        return 'Chuỗi ngày';
      case 'lessons':
        return 'Bài học';
      case 'xp':
        return 'Điểm XP';
      case 'vocabulary':
        return 'Từ vựng';
      default:
        return category;
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  const categories = ['streak', 'lessons', 'xp', 'vocabulary'] as const;

  // State for unlock celebration modal
  const [celebrateAchievement, setCelebrateAchievement] = useState<Achievement | null>(null);
  const [viewedAchievements, setViewedAchievements] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('viewedAchievements');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // Check for newly unlocked achievements
  useEffect(() => {
    const newlyUnlocked = achievements.find(
      a => a.unlocked && !viewedAchievements.has(a.id)
    );
    if (newlyUnlocked) {
      setCelebrateAchievement(newlyUnlocked);
    }
  }, [achievements, viewedAchievements]);

  const handleCloseCelebration = () => {
    if (celebrateAchievement) {
      const newViewed = new Set(viewedAchievements);
      newViewed.add(celebrateAchievement.id);
      setViewedAchievements(newViewed);
      localStorage.setItem('viewedAchievements', JSON.stringify([...newViewed]));
    }
    setCelebrateAchievement(null);
  };

  // Confetti particles
  const Confetti = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '50%',
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${0.8 + Math.random() * 0.4}s`,
          }}
        >
          <Sparkles 
            className="w-4 h-4" 
            style={{ 
              color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6'][Math.floor(Math.random() * 5)] 
            }} 
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Thành tích</h1>
          <p className="text-muted-foreground mt-1">Theo dõi tiến trình và mở khóa thành tích</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-bold text-primary">{unlockedCount}/{totalCount}</span>
        </div>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Tiến trình tổng thể</h3>
              <p className="text-muted-foreground text-sm">
                Bạn đã mở khóa {unlockedCount} trong tổng số {totalCount} thành tích
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">
                {Math.round((unlockedCount / totalCount) * 100)}%
              </span>
            </div>
          </div>
          <Progress value={(unlockedCount / totalCount) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Achievements by Category */}
      {categories.map(category => (
        <div key={category} className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            {category === 'streak' && <Flame className="w-5 h-5 text-orange-500" />}
            {category === 'lessons' && <BookOpen className="w-5 h-5 text-blue-500" />}
            {category === 'xp' && <Star className="w-5 h-5 text-yellow-500" />}
            {category === 'vocabulary' && <Target className="w-5 h-5 text-green-500" />}
            {getCategoryLabel(category)}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements
              .filter(a => a.category === category)
              .map(achievement => (
                <Card 
                  key={achievement.id}
                  className={`transition-all duration-300 hover:scale-[1.02] cursor-pointer group ${
                    achievement.unlocked 
                      ? 'border-primary/50 bg-primary/5 animate-achievement-glow' 
                      : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-80'
                  }`}
                  onClick={() => achievement.unlocked && setCelebrateAchievement(achievement)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`relative p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                        achievement.unlocked 
                          ? `bg-gradient-to-br ${getRarityGradient(achievement.rarity)} text-white shadow-lg` 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {achievement.unlocked && (
                          <div className="absolute inset-0 rounded-xl animate-pulse-ring bg-primary/30" />
                        )}
                        {achievement.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {achievement.title}
                          </h3>
                          <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                            {getRarityLabel(achievement.rarity)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {achievement.description}
                        </p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Tiến trình</span>
                            <span className="font-medium">
                              {Math.min(achievement.current, achievement.requirement)}/{achievement.requirement}
                            </span>
                          </div>
                          <Progress 
                            value={Math.min((achievement.current / achievement.requirement) * 100, 100)} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}

      {/* Achievement Celebration Modal */}
      <Dialog open={!!celebrateAchievement} onOpenChange={() => handleCloseCelebration()}>
        <DialogContent className="sm:max-w-md overflow-hidden">
          <div className="relative text-center py-8">
            <Confetti />
            
            {/* Glowing background */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent rounded-lg" />
            
            {/* Icon with animation */}
            <div className="relative mb-6">
              <div className={`inline-flex p-6 rounded-full bg-gradient-to-br ${celebrateAchievement ? getRarityGradient(celebrateAchievement.rarity) : ''} animate-bounce-in shadow-2xl`}>
                <div className="text-white w-12 h-12 flex items-center justify-center">
                  {celebrateAchievement?.icon}
                </div>
              </div>
              {/* Pulse rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-2 border-primary/50 animate-pulse-ring" />
              </div>
            </div>

            <div className="relative space-y-3">
              <Badge variant="outline" className={celebrateAchievement ? getRarityColor(celebrateAchievement.rarity) : ''}>
                {celebrateAchievement && getRarityLabel(celebrateAchievement.rarity)}
              </Badge>
              
              <h2 className="text-2xl font-bold text-foreground animate-achievement-unlock">
                🎉 Thành tích mới!
              </h2>
              
              <h3 className="text-xl font-semibold text-primary">
                {celebrateAchievement?.title}
              </h3>
              
              <p className="text-muted-foreground">
                {celebrateAchievement?.description}
              </p>

              <Button 
                onClick={handleCloseCelebration}
                className="mt-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Tuyệt vời!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Achievements;
