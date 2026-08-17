"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type PublicContact = {
  id: string;
  service: string;
  channelType: string;
  label: string;
  value: string;
  purpose: string;
};

const PublicContactsContext = createContext<PublicContact[]>([]);

export function PublicContactProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<PublicContact[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/public/contacts", { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<{ contacts?: PublicContact[] }> : { contacts: [] })
      .then((data) => setContacts(Array.isArray(data.contacts) ? data.contacts : []))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const value = useMemo(() => contacts, [contacts]);
  return <PublicContactsContext.Provider value={value}>{children}</PublicContactsContext.Provider>;
}

export function usePublicContacts() {
  return useContext(PublicContactsContext);
}

export function usePublicContact(service: string, purpose: string) {
  const contacts = usePublicContacts();
  return contacts.find((contact) => contact.service === service && contact.purpose === purpose) ?? null;
}
