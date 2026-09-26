const shapes = {
  home: (
    <path d="M10.1 3.3a3 3 0 0 1 3.8 0l6 4.9A3 3 0 0 1 21 10.5V18a3 3 0 0 1-3 3h-3v-6a3 3 0 0 0-6 0v6H6a3 3 0 0 1-3-3v-7.5a3 3 0 0 1 1.1-2.3Z" />
  ),
  calendar: (
    <>
      <path
        opacity=".45"
        d="M7 2a1 1 0 0 1 1 1v2h8V3a1 1 0 1 1 2 0v2a4 4 0 0 1 4 4v1H2V9a4 4 0 0 1 4-4V3a1 1 0 0 1 1-1Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 12h20v6a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4Zm13.7 2.3a1 1 0 0 0-1.4 0L11 17.6l-1.3-1.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4a1 1 0 0 0 0-1.4Z"
      />
    </>
  ),
  graduation: (
    <>
      <path d="M11.1 2.4a2 2 0 0 1 1.8 0l9 4.5a1.2 1.2 0 0 1 0 2.2l-9 4.5a2 2 0 0 1-1.8 0l-9-4.5a1.2 1.2 0 0 1 0-2.2Z" />
      <path
        opacity=".5"
        d="m5 12.7 5.2 2.6a4 4 0 0 0 3.6 0l5.2-2.6V17c0 2.3-3.1 4-7 4s-7-1.7-7-4Z"
      />
      <rect x="21" y="10" width="2" height="7" rx="1" />
    </>
  ),
  image: (
    <>
      <path
        opacity=".4"
        d="M3 6a1 1 0 0 1 1 1v11a2 2 0 0 0 2 2h11a1 1 0 1 1 0 2H6a4 4 0 0 1-4-4V7a1 1 0 0 1 1-1Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 2h9a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Zm7.5 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM8 14.5c0 .8.7 1.5 1.5 1.5h8a1 1 0 0 0 .8-1.6l-2.2-2.9a1.2 1.2 0 0 0-1.8-.1l-1.2 1.2-2-2.6a1.2 1.2 0 0 0-1.9 0L8 11.7Z"
      />
    </>
  ),
  phone: (
    <>
      <path d="M20.5 2.2 3 8.8c-1.3.5-1.3 2.3 0 2.8l5.4 2 8.2-7.1a.6.6 0 0 1 .8.9l-7.1 8.2 2.1 5.4c.5 1.3 2.3 1.3 2.8 0l6.6-17.5c.3-.9-.4-1.6-1.3-1.3Z" />
      <path opacity=".45" d="m8.4 13.6 1.9 2-.8 4.1a.7.7 0 0 1-1.4-.1Z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="7" r="5" />
      <path opacity=".5" d="M3 21a9 9 0 0 1 18 0 1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
    </>
  ),
};

export default function MobileNavIcon({ name, fallback: Fallback }) {
  return (
    <span className="mobile-nav-icon" aria-hidden="true">
      {shapes[name] ? (
        <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
          {shapes[name]}
        </svg>
      ) : (
        <Fallback size={25} strokeWidth={2.2} />
      )}
    </span>
  );
}
