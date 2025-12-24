-- =====================================================
-- FIX: MISSING PROFILES
-- Execute este script se seu usuário não aparece na tabela 'profiles'
-- =====================================================

DO $$
BEGIN
    -- 1. Tenta inserir perfis para usuários que existem no Auth mas não no Profiles
    INSERT INTO public.profiles (id, email, role, nome)
    SELECT 
        au.id, 
        au.email, 
        'user', -- role padrão
        COALESCE(au.raw_user_meta_data->>'nome', split_part(au.email, '@', 1)) -- Nome ou parte do email
    FROM auth.users au
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = au.id
    );

    -- 2. Confirmação (apenas exibe mensagem nos logs)
    RAISE NOTICE 'Verificação de perfis completada.';
END $$;
