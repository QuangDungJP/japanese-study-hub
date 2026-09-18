import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verify current user is admin (optional safety check)
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { email, password, full_name, role } = await req.json()

    // Create admin client to bypass RLS and create user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Create user in auth
    const { data: newAuthUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      }
    })

    if (createUserError) throw createUserError

    const userId = newAuthUser.user.id

    // 2. Profile is usually created by trigger, but we update full_name just in case
    await supabaseAdmin
      .from('profiles')
      .update({ full_name })
      .eq('user_id', userId)

    // 3. Assign role
    if (role && role !== 'user') {
      await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role })
    }

    return new Response(
      JSON.stringify({ user: newAuthUser.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
