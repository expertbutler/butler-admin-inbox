'use client';

import { useEffect, useState } from 'react';

// How close to the bottom still counts as "looking at the latest messages".
const BOTTOM_THRESHOLD_PX = 80;

const isNearBottom = () =>
  window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - BOTTOM_THRESHOLD_PX;

const scrollToBottom = (behavior: ScrollBehavior) =>
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior });

export const ScrollToLatest = () => {
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    scrollToBottom('instant');

    // Tracked separately from state because it must hold the position from *before* the page
    // grew: once a new message renders, the reader is no longer near the bottom.
    let wasAtBottom = true;
    const update = () => {
      wasAtBottom = isNearBottom();
      setIsAtBottom(wasAtBottom);
    };
    update();

    // A refresh that brings in new messages grows the page; follow it only if the reader was
    // already at the latest message, so scrolling up through history isn't interrupted.
    const followNewMessages = new ResizeObserver(() => {
      if (wasAtBottom) scrollToBottom('smooth');
    });
    followNewMessages.observe(document.body);

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      followNewMessages.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  if (isAtBottom) return null;

  return (
    <button
      type="button"
      onClick={() => scrollToBottom('smooth')}
      aria-label="Scroll to latest messages"
      className="absolute bottom-full right-6 mb-3 rounded-full border border-slate-300 bg-white p-2 shadow-md hover:bg-slate-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
};
