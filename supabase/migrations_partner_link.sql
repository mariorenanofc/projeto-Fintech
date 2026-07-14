-- =====================================================================
-- MIGRATION: CONFIGURAÇÃO DE VINCULO DE CONTA CONJUGAL
-- =====================================================================
-- Esta migração cria uma função PL/pgSQL com privilégios de SECURITY DEFINER
-- para permitir que usuários autenticados localizem e vinculem seus cônjuges
-- ao mesmo grupo familiar, contornando restrições de RLS de SELECT/UPDATE cruzado.

CREATE OR REPLACE FUNCTION public.link_partner_by_email(partner_email text)
RETURNS jsonb AS $$
DECLARE
  current_user_id uuid;
  current_family_id uuid;
  partner_profile record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.link_partner_by_email(partner_email text)
RETURNS jsonb AS $$
DECLARE
  current_user_id uuid;
  current_family_id uuid;
  partner_profile record;
BEGIN
  -- 1. Obter o ID do usuário autenticado a partir do contexto do Supabase Auth
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado.');
  END IF;

  -- 2. Obter o family_group_id do usuário atual
  SELECT family_group_id INTO current_family_id 
  FROM public.profiles 
  WHERE id = current_user_id;

  IF current_family_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Perfil do usuário logado não foi encontrado no banco.');
  END IF;

  -- 3. Buscar o parceiro pelo e-mail (usando TRIM e LOWER para evitar problemas de formatação)
  SELECT id, family_group_id, full_name INTO partner_profile
  FROM public.profiles
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(partner_email))
  LIMIT 1;

  -- Validar se o parceiro existe
  IF partner_profile.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Parceiro não encontrado. Peça para o seu parceiro se cadastrar no aplicativo antes de vinculá-lo.');
  END IF;

  -- Impedir auto-vinculação
  IF partner_profile.id = current_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode se vincular ao seu próprio e-mail.');
  END IF;

  -- 4. Atualizar o family_group_id do parceiro para o mesmo do usuário atual
  UPDATE public.profiles
  SET family_group_id = current_family_id,
      updated_at = now()
  WHERE id = partner_profile.id;

  RETURN jsonb_build_object(
    'success', true, 
    'partnerName', COALESCE(partner_profile.full_name, partner_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
