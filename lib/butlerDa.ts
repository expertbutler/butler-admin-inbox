import { createClient } from '@/lib/supabase/server';

type CallButlerDaParams = {
  path: string;
  body: unknown;
};

type CallButlerDaResult = {
  status: number;
  payload: unknown;
};

/**
 * Every write goes through butler-da, which holds the credentials and the
 * message-sending logic. Called from this app's server only, forwarding the
 * signed-in user's access token, so the token never reaches the browser and
 * butler-da can attribute the write to a real account.
 */
export const callButlerDa = async ({
  path,
  body,
}: CallButlerDaParams): Promise<CallButlerDaResult> => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { status: 401, payload: { error: 'Not signed in.' } };

  const response = await fetch(`${process.env.BUTLER_DA_API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  return { status: response.status, payload: await response.json().catch(() => ({})) };
};
