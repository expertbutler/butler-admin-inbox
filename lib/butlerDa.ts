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
    // butler-da redirects requests it doesn't recognise to its login page. Followed, that
    // arrives as a 200 HTML page and the write would look like it succeeded.
    redirect: 'manual',
  });

  const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
  if (!isJson) {
    return {
      status: 502,
      payload: { error: `butler-da did not accept this request (HTTP ${response.status}).` },
    };
  }

  return { status: response.status, payload: await response.json().catch(() => ({})) };
};
