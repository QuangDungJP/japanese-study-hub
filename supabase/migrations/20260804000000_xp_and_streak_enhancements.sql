-- Migration for XP and Streak enhancements and RPC functions

CREATE OR REPLACE FUNCTION public.award_user_xp_and_streak(
  p_user_id UUID,
  p_xp_amount INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_progress RECORD;
  v_new_total_xp INTEGER;
  v_new_daily_progress INTEGER;
  v_new_streak INTEGER;
BEGIN
  SELECT * INTO v_progress FROM public.user_progress WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_progress (user_id, total_xp, streak, daily_progress, last_activity_date)
    VALUES (p_user_id, GREATEST(0, p_xp_amount), 1, GREATEST(0, p_xp_amount), v_today)
    RETURNING * INTO v_progress;
    
    RETURN jsonb_build_object(
      'total_xp', v_progress.total_xp,
      'streak', v_progress.streak,
      'daily_progress', v_progress.daily_progress
    );
  END IF;

  v_new_total_xp := GREATEST(0, COALESCE(v_progress.total_xp, 0) + p_xp_amount);
  
  -- Calculate daily progress
  IF v_progress.last_activity_date = v_today THEN
    v_new_daily_progress := GREATEST(0, COALESCE(v_progress.daily_progress, 0) + p_xp_amount);
  ELSE
    v_new_daily_progress := GREATEST(0, p_xp_amount);
  END IF;

  -- Calculate streak
  IF v_progress.last_activity_date = v_today THEN
    v_new_streak := GREATEST(1, COALESCE(v_progress.streak, 1));
  ELSIF v_progress.last_activity_date = v_yesterday THEN
    v_new_streak := COALESCE(v_progress.streak, 0) + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  UPDATE public.user_progress
  SET 
    total_xp = v_new_total_xp,
    daily_progress = v_new_daily_progress,
    streak = v_new_streak,
    last_activity_date = v_today,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'total_xp', v_new_total_xp,
    'streak', v_new_streak,
    'daily_progress', v_new_daily_progress
  );
END;
$$;

-- Function for Admin / Teacher manual XP & Streak adjustments (+ / -)
CREATE OR REPLACE FUNCTION public.adjust_user_xp_and_streak(
  p_user_id UUID,
  p_xp_delta INTEGER DEFAULT 0,
  p_streak_delta INTEGER DEFAULT 0,
  p_streak_set INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_progress RECORD;
  v_new_total_xp INTEGER;
  v_new_streak INTEGER;
BEGIN
  SELECT * INTO v_progress FROM public.user_progress WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    v_new_total_xp := GREATEST(0, p_xp_delta);
    IF p_streak_set IS NOT NULL THEN
      v_new_streak := GREATEST(0, p_streak_set);
    ELSE
      v_new_streak := GREATEST(0, p_streak_delta);
    END IF;

    INSERT INTO public.user_progress (user_id, total_xp, streak, last_activity_date)
    VALUES (p_user_id, v_new_total_xp, v_new_streak, CURRENT_DATE)
    RETURNING * INTO v_progress;
  ELSE
    v_new_total_xp := GREATEST(0, COALESCE(v_progress.total_xp, 0) + p_xp_delta);
    
    IF p_streak_set IS NOT NULL THEN
      v_new_streak := GREATEST(0, p_streak_set);
    ELSE
      v_new_streak := GREATEST(0, COALESCE(v_progress.streak, 0) + p_streak_delta);
    END IF;

    UPDATE public.user_progress
    SET 
      total_xp = v_new_total_xp,
      streak = v_new_streak,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'total_xp', v_new_total_xp,
    'streak', v_new_streak
  );
END;
$$;
