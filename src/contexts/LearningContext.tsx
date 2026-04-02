import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, UserProgress } from '@/types/learning';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LearningContextType {
  currentLanguage: Language;
  setCurrentLanguage: (lang: Language) => void;
  userProgress: UserProgress;
  addXp: (amount: number) => void;
  completedLessons: string[];
  completeLesson: (lessonId: string) => void;
  loading: boolean;
}

const defaultProgress: UserProgress = {
  totalXp: 0,
  streak: 0,
  lessonsCompleted: 0,
  vocabularyMastered: 0,
  dailyGoal: 50,
  dailyProgress: 0,
};

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export const LearningProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState<Language>('japanese');
  const [userProgress, setUserProgress] = useState<UserProgress>(defaultProgress);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user progress from database
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!user) {
        setUserProgress(defaultProgress);
        setCompletedLessons([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch user progress
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (progressData) {
          setUserProgress({
            totalXp: progressData.total_xp || 0,
            streak: progressData.streak || 0,
            lessonsCompleted: progressData.lessons_completed || 0,
            vocabularyMastered: progressData.vocabulary_mastered || 0,
            dailyGoal: progressData.daily_goal || 50,
            dailyProgress: progressData.daily_progress || 0,
          });
        }

        // Fetch completed lessons
        const { data: lessonsData } = await supabase
          .from('completed_lessons')
          .select('lesson_id')
          .eq('user_id', user.id);

        if (lessonsData) {
          setCompletedLessons(lessonsData.map(l => l.lesson_id));
        }

        // Fetch current language from profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('current_language')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData?.current_language) {
          setCurrentLanguage(profileData.current_language as Language);
        }
      } catch (error) {
        console.error('Error fetching user progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProgress();
  }, [user]);

  const addXp = async (amount: number) => {
    const newProgress = {
      ...userProgress,
      totalXp: userProgress.totalXp + amount,
      dailyProgress: Math.min(userProgress.dailyProgress + amount, userProgress.dailyGoal),
    };
    setUserProgress(newProgress);

    if (user) {
      await supabase
        .from('user_progress')
        .update({
          total_xp: newProgress.totalXp,
          daily_progress: newProgress.dailyProgress,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }
  };

  const completeLesson = async (lessonId: string) => {
    if (completedLessons.includes(lessonId)) return;

    setCompletedLessons(prev => [...prev, lessonId]);
    const newProgress = {
      ...userProgress,
      lessonsCompleted: userProgress.lessonsCompleted + 1,
    };
    setUserProgress(newProgress);

    if (user) {
      // Insert completed lesson
      await supabase
        .from('completed_lessons')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
        });

      // Update user progress
      await supabase
        .from('user_progress')
        .update({
          lessons_completed: newProgress.lessonsCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }
  };

  const handleLanguageChange = async (lang: Language) => {
    setCurrentLanguage(lang);
    
    if (user) {
      await supabase
        .from('profiles')
        .update({ current_language: lang })
        .eq('user_id', user.id);
    }
  };

  return (
    <LearningContext.Provider value={{
      currentLanguage,
      setCurrentLanguage: handleLanguageChange,
      userProgress,
      addXp,
      completedLessons,
      completeLesson,
      loading,
    }}>
      {children}
    </LearningContext.Provider>
  );
};

export const useLearning = () => {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearning must be used within LearningProvider');
  }
  return context;
};
