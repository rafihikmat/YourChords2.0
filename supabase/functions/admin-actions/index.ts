import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PATCH',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Create a Supabase client with the Auth context of the logged-in user
    const supabaseClient = createClient(
      // @ts-ignore: Deno env access
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore: Deno env access
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 2. Get the user from the request context
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // 3. Verify the user is a super_admin by checking the profiles table
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: "Forbidden: Requires Super Admin privileges." }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Initialize Admin Client (Service Role)
    const supabaseAdmin = createClient(
      // @ts-ignore: Deno env access
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore: Deno env access
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, targetUserId, newRole } = await req.json();

    if (!targetUserId) {
      throw new Error("Target User ID is required.");
    }

    // 5. Handle Actions
    if (action === 'DELETE_USER') {
        // CLEANUP: Delete related records in public tables to prevent FK violations
        // (In case ON DELETE CASCADE is not configured in the database)
        const tablesToCleanup = ['profiles', 'song_favorites', 'song_ratings', 'ai_song_queue'];
        
        for (const table of tablesToCleanup) {
            // We ignore errors here because the record might not exist or the table might not have the user_id column in the way we expect (though we know they do from schema)
            // Using 'requested_by' for ai_song_queue, 'user_id' for others.
            const column = table === 'ai_song_queue' ? 'requested_by' : 'user_id';
            const idColumn = table === 'profiles' ? 'id' : column; // profiles uses 'id' as user_id

            await supabaseAdmin.from(table).delete().eq(idColumn, targetUserId);
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
        if (deleteError) throw deleteError;
        
        return new Response(JSON.stringify({ message: "User deleted successfully." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } 
    else if (action === 'UPDATE_ROLE') {
        if (!newRole || !['user', 'admin', 'super_admin'].includes(newRole)) {
            throw new Error("Invalid role provided.");
        }

        // Update public profile
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ role: newRole })
            .eq('id', targetUserId);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ message: "User role updated successfully." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
    else {
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
