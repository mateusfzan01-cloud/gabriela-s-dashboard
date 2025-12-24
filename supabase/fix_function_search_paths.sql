-- Fix Function Search Path Mutable Warnings
-- Run this script to secure existing functions

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.fn_recebiveis_mes(INTEGER, INTEGER) SET search_path = public;
ALTER FUNCTION public.fn_confirmar_recebimento(UUID, DATE) SET search_path = public;
ALTER FUNCTION public.fn_update_timestamp() SET search_path = public;
ALTER FUNCTION public.fn_set_status_imediato() SET search_path = public;
