import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { STATUS_CLASSES, STATUS_LABELS } from '@/lib/conversationStatus';

const PAGE_SIZE = 25;

type SearchParams = { hotel?: string; phone?: string; page?: string };

export default async function InboxPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();

  const page = Math.max(1, Number(searchParams.page ?? '1') || 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('whatsapp_conversations')
    .select('*', { count: 'exact' })
    .order('last_message_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (searchParams.hotel) query = query.eq('hotel_id', searchParams.hotel);
  if (searchParams.phone) query = query.ilike('guest_phone', `%${searchParams.phone}%`);

  const [{ data: conversations, count }, { data: hotels }] = await Promise.all([
    query,
    supabase.from('hotels').select('hotel_id, name').order('name'),
  ]);

  const hotelNames = new Map((hotels ?? []).map((hotel) => [hotel.hotel_id, hotel.name]));
  const total = count ?? 0;
  const hasNextPage = from + PAGE_SIZE < total;

  return (
    <main>
      <h1 className="text-2xl font-bold">Conversations</h1>
      <p className="mt-1 text-sm text-slate-500">
        {total} conversation{total === 1 ? '' : 's'} across all hotels.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Hotel
          <select
            name="hotel"
            defaultValue={searchParams.hotel ?? ''}
            className="rounded border border-slate-300 px-3 py-2"
          >
            <option value="">All hotels</option>
            {(hotels ?? []).map((hotel) => (
              <option key={hotel.hotel_id} value={hotel.hotel_id}>
                {hotel.name ?? hotel.hotel_id}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Guest phone
          <input
            type="search"
            name="phone"
            defaultValue={searchParams.phone ?? ''}
            placeholder="e.g. 40745"
            className="rounded border border-slate-300 px-3 py-2"
          />
        </label>

        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white">
          Filter
        </button>
        <Link href="/" className="px-2 py-2 text-sm text-slate-500 underline">
          Clear
        </Link>
      </form>

      <div className="mt-6 overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Hotel</th>
              <th className="px-4 py-3 font-medium">Guest</th>
              <th className="px-4 py-3 font-medium">Room</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last message</th>
            </tr>
          </thead>
          <tbody>
            {(conversations ?? []).map((conversation) => (
              <tr key={conversation.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  {hotelNames.get(conversation.hotel_id) ?? conversation.hotel_id}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/conversations/${conversation.id}`}
                    className="font-medium underline"
                  >
                    {conversation.guest_phone}
                  </Link>
                </td>
                <td className="px-4 py-3">{conversation.room_number ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-1 text-xs ${STATUS_CLASSES[conversation.status]}`}
                  >
                    {STATUS_LABELS[conversation.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(conversation.last_message_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(conversations ?? []).length === 0 ? (
          <p className="px-4 py-8 text-center text-slate-500">No conversations match those filters.</p>
        ) : null}
      </div>

      <nav className="mt-4 flex items-center gap-4 text-sm">
        {page > 1 ? (
          <Link
            href={{ query: { ...searchParams, page: page - 1 } }}
            className="underline"
          >
            Previous
          </Link>
        ) : null}
        <span className="text-slate-500">Page {page}</span>
        {hasNextPage ? (
          <Link href={{ query: { ...searchParams, page: page + 1 } }} className="underline">
            Next
          </Link>
        ) : null}
      </nav>
    </main>
  );
}
