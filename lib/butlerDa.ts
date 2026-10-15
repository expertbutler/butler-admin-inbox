import { createClient } from '@/lib/supabase/server';
import { JsonResponse } from '@/lib/payload';

type CallButlerDaParams = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT';
  body?: unknown;
};

/**
 * Every write, and every read of something other than conversations, goes through
 * butler-da, which holds the credentials and the message-sending logic. Called from
 * this app's server only, forwarding the signed-in user's access token, so the token
 * never reaches the browser and butler-da can attribute the write to a real account.
 */
export const callButlerDa = async ({
  path,
  method = 'POST',
  body,
}: CallButlerDaParams): Promise<JsonResponse> => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { status: 401, payload: { error: 'Not signed in.' } };

  const response = await fetch(`${process.env.BUTLER_DA_API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    // butler-da redirects requests it doesn't recognise to its login page. Followed, that
    // arrives as a 200 HTML page and the write would look like it succeeded.
    redirect: 'manual',
  }).catch(() => null);

  if (!response) return { status: 502, payload: { error: 'Could not reach butler-da.' } };

  const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
  if (!isJson) {
    return {
      status: 502,
      payload: { error: `butler-da did not accept this request (HTTP ${response.status}).` },
    };
  }

  return { status: response.status, payload: await response.json().catch(() => ({})) };
};
