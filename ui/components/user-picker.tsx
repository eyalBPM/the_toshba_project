'use client';

import { useState, useEffect, useRef } from 'react';

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface UserPickerProps {
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
}

export function UserPicker({ value, onChange, placeholder = 'חפש משתמש...' }: UserPickerProps) {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<UserOption[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<UserOption | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!search && !open) return;
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ status: 'VerifiedUser' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/users?${params}`);
      if (res.ok) {
        const json = await res.json();
        setOptions(json.data ?? []);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [search, open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(user: UserOption) {
    setSelected(user);
    onChange(user.id);
    setOpen(false);
    setSearch('');
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={selected ? `${selected.name} (${selected.email})` : placeholder}
        value={search}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
      />
      {/* Hidden input to carry the actual id value */}
      <input type="hidden" value={value} />
      {open && options.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          {options.map((u) => (
            <li
              key={u.id}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50"
              onMouseDown={() => handleSelect(u)}
            >
              <span className="font-medium">{u.name}</span>
              <span className="mr-2 text-gray-500">{u.email}</span>
            </li>
          ))}
        </ul>
      )}
      {open && options.length === 0 && search.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg">
          לא נמצאו משתמשים
        </div>
      )}
    </div>
  );
}
