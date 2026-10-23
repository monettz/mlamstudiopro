export default function AccountIcon({name, className}:{name:'eye'|'eye-off'|'user'|'download'|'book'|'check'|'info'|'arrow'|'copy'|'key'|'receipt'|'shield'; className?: string}) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    {name==='eye'&&<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>}
    {name==='eye-off'&&<><path d="m3 3 18 18M10 5.2 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 4M6 6.5A20 20 0 0 0 2 12s3.5 7 10 7c1.9 0 3.5-.6 5-1.5M10 10a3 3 0 0 0 4 4"/></>}
    {name==='user'&&<><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>}
    {name==='download'&&<><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></>}
    {name==='book'&&<><path d="M12 6v15M3 4h4c2 0 4 .8 5 2 1-1.2 3-2 5-2h4v15h-4c-2 0-4 .8-5 2-1-1.2-3-2-5-2H3Z"/></>}
    {name==='check'&&<><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>}
    {name==='info'&&<><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>}
    {name==='arrow'&&<path d="M4 12h16m-6-6 6 6-6 6"/>}
    {name==='copy'&&<><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></>}
    {name==='key'&&<><path d="m21 2-2 2m-1.5 1.5L14 9l2 2m-3-1 2 2m-4-1 2 2M3 21l6.5-6.5a4.95 4.95 0 0 1-1-3 5 5 0 1 1 5 5c-1 0-2.1-.3-3-1L3 21Z"/></>}
    {name==='receipt'&&<><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-8m8 4h-8m5 4h-5"/></>}
    {name==='shield'&&<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}
  </svg>;
}
