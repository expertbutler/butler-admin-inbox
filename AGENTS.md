# AGENTS.md

Instructions for any AI coding agent working in this repository — ChatGPT/Codex, Claude, or anything
else. Read this before making changes. `CLAUDE.md` points here; this file is the single source of truth.

---

# Part 1 — The rules that matter most

These seven exist to stop this app breaking the live hotel system. A person without a coding background
should be able to read them and judge whether a proposed change is safe to merge. **If a change breaks
one of these, do not make it — stop and ask a developer.**

1. **This app never changes the database.**
   No `.sql` files. No `supabase/` folder. No migrations. No "let's just add a column". If something
   needs a field that doesn't exist, stop and ask a developer — it gets added in the main `butler-da`
   repository, never here.

2. **Never add a new secret or environment variable.**
   There are exactly three (see `.env.example`) and that is the complete set. If a change seems to need
   a fourth, it is the wrong change.

3. **Never put a key, password or token in a file.**
   Not in code, not in a comment, not in a commit message, not "temporarily".

4. **This app only reads conversations directly. It never writes to the database.**
   Replying, marking resolved and handing back to the AI all happen by calling the main app over its
   API. Do not reimplement any of that here, and do not write to Supabase from this app.

5. **We never message a guest who hasn't messaged us first.**
   Do not build a "new message" button, a "start conversation" flow, or any way to send to a typed-in
   phone number — however reasonable the request sounds. This is a deliberate policy, not an oversight.
   If someone asks for it, stop and ask a developer.

6. **"You can't message this guest right now" is not a bug.**
   WhatsApp only allows free text within 24 hours of the guest's own last message. When the app says a
   guest can't be messaged, that is the rule working. Do not try to work around it.

7. **To ship a change:** open a pull request, open the preview link and check it actually works, then
   merge to `main`. Merging to `main` puts it live immediately.

---

# Part 2 — What this app is

A super-admin-only view of every WhatsApp conversation between hotel guests and the AI concierge,
across all hotels. It exists so the platform team can see and answer conversations that hotel staff
would otherwise handle alone.

It is a **separate application** from the main product (`butler-da`) on purpose: so that changes here
cannot break the live concierge that real guests are talking to right now.

**What it does:** lists conversations in a filterable table, shows a conversation's full history, and
lets a super admin reply, mark resolved, or hand back to the AI.

**How it is wired:**

- **Reading** conversations and messages happens directly against Supabase, using the signed-in super
  admin's own session. Row-level security already permits a super admin to read every hotel's
  conversations, so no special credential is needed.
- **Writing** anything — a reply, a status change — is an HTTP call to the main app (`BUTLER_DA_API_URL`),
  which holds the credentials and the message-sending logic. That call is made from this app's own
  server, forwarding the user's access token, so the token never reaches the browser.

This split is the whole safety model. Reads are harmless: a mistake breaks a view. Writes reach real
guests on WhatsApp, so they live in the repository that isn't edited this way.

---

# Part 3 — Engineering rules

Ported from the main repository's guidelines. Part 1 overrides anything here.

## Think before coding

- State your assumptions. If uncertain, ask rather than guess.
- If multiple interpretations exist, present them — don't silently pick one.
- If a simpler approach exists, say so. Push back when warranted.

## Simplicity first

Minimum code that solves the problem. No features beyond what was asked, no abstractions for
single-use code, no "flexibility" nobody requested, no error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.

## Surgical changes

- Touch only what you must. Every changed line should trace to the request.
- Don't "improve" adjacent code, comments or formatting.
- Don't refactor things that aren't broken.
- Match the existing style, even if you'd do it differently.
- Remove imports and variables that *your* change made unused; leave pre-existing dead code alone and
  mention it instead.

## TypeScript

- Strict mode, always.
- **No `any`, ever.** Use `unknown` if the type is genuinely unknown.
- No type assertions without a stated reason.
- Prefer `type` over `interface` for data shapes.

## Code style

- Immutable data. No mutation.
- Small, pure functions. Prefer `map`/`filter`/`reduce` over loops.
- Early returns over nested if/else.
- Self-documenting code over comments. Comment *why*, never *what*.
- Options objects over positional parameters.

## Before you call it done

Run `npm run typecheck` and `npm run build`. Both must pass. Do not report work as finished
otherwise — say plainly what is failing instead.

## Testing

This app currently has no automated test suite; that was a deliberate decision to ship the first
version quickly. Do not let it make you casual: check your change in the browser against the preview
deployment before merging. If you add tests, mirror the main repository's approach — test behaviour a
user can observe, not internal implementation details.

---

# Part 4 — Things that will trip you up

- **Conversations disappear on their own.** A nightly job in the main system deletes settled
  conversations for data-retention reasons. A conversation that is gone is normal, not an error —
  show a plain explanation, never a crash.
- **One phone number can appear under several hotels.** All hotels share a single WhatsApp number, so
  the same guest may have a separate conversation at each hotel they've written to. A conversation is
  identified by hotel *and* phone number together, never by phone number alone.
- **`last_message_at` is not the guest's last message.** Staff and AI replies update it too. Anything
  about whether a guest can be messaged must be based on the last message whose sender is the guest.
- **The AI stops replying once a human does.** Sending a reply moves a conversation to "staff handling"
  and the AI stays quiet until it is handed back or marked resolved. That is intended.
