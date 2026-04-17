// app/api/channels/[id]/activate/route.js
export const runtime = 'nodejs';
export const maxDuration = 5;

import { verifyAuth } from '@/packages/supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request, { params }) {
  try {
    let user;
    try { user = await verifyAuth(request); }
    catch (e) { return Response.json({ error: e.message }, { status: 401 }); }

    // Verify channel belongs to user
    const { data: channel, error } = await supabaseAdmin
      .from('channels')
      .select('id, name')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !channel) {
      return Response.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Update profile active_channel_id
    await supabaseAdmin
      .from('profiles')
      .update({ active_channel_id: params.id, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    // Update last_used_at on channel
    await supabaseAdmin
      .from('channels')
      .update({ last_used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', params.id);

    return Response.json({ success: true, active_channel_id: params.id, channel_name: channel.name });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}