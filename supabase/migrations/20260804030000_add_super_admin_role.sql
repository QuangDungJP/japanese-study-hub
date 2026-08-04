-- Migration to safely add 'super_admin' to public.app_role enum type

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
