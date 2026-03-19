"use client";

import { useState, useEffect, useCallback } from "react";
import { EmailList } from "@/components/email-list";
import { SearchBar } from "@/components/search-bar";
import type { Email } from "@/types";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Email[] | null>(null);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/emails?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.data);
    } catch {
      // Ignore
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, doSearch]);

  return (
    <div className="space-y-4">
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      {searching && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}
      <EmailList searchResults={searchResults} />
    </div>
  );
}
