import { useState, useEffect } from 'react';
import { Trophy, Flame, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface Learner {
  id: string;
  full_name: string;
  avatar_url: string | null;
  total_xp: number;
  streak: number;
  lessons_completed: number;
}

const TopLearnersCard = () => {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopLearners();
  }, []);

  const fetchTopLearners = async () => {
    try {
      const { data: progress } = await supabase
        .from('user_progress')
        .select('user_id, total_xp, streak, lessons_completed')
        .order('total_xp', { ascending: false })
        .limit(5);

      if (progress && progress.length > 0) {
        const userIds = progress.map(p => p.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        const combined = progress.map(p => {
          const profile = profiles?.find(pr => pr.user_id === p.user_id);
          return {
            id: p.user_id,
            full_name: profile?.full_name || 'Unknown',
            avatar_url: profile?.avatar_url,
            total_xp: p.total_xp || 0,
            streak: p.streak || 0,
            lessons_completed: p.lessons_completed || 0,
          };
        });

        setLearners(combined);
      }
    } catch (error) {
      console.error('Error fetching top learners:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Trophy className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-soft h-full">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-soft h-full">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500" />
        Top học viên
      </h2>
      
      {learners.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Chưa có dữ liệu học viên
        </div>
      ) : (
        <div className="space-y-3">
          {learners.map((learner, index) => (
            <div 
              key={learner.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex-shrink-0">
                {getRankBadge(index)}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={learner.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {learner.full_name?.slice(0, 2).toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{learner.full_name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    {learner.total_xp} XP
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    {learner.streak} ngày
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{learner.lessons_completed}</p>
                <p className="text-xs text-muted-foreground">bài học</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopLearnersCard;
