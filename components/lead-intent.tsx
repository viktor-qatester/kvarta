"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Interest = "subscription" | "order" | "question";

type LeadIntentValue = {
  interest: Interest | "";
  productName: string | null;
  setInterest: (value: Interest) => void;
  chooseOrder: (productName: string) => void;
  chooseSubscription: () => void;
};

const LeadIntentContext = createContext<LeadIntentValue | null>(null);

export function LeadIntentProvider({ children }: { children: ReactNode }) {
  const [interest, setInterest] = useState<Interest | "">("");
  const [productName, setProductName] = useState<string | null>(null);

  const chooseOrder = useCallback((name: string) => {
    setInterest("order");
    setProductName(name);
  }, []);

  const chooseSubscription = useCallback(() => {
    setInterest("subscription");
  }, []);

  const value = useMemo(
    () => ({
      interest,
      productName,
      setInterest,
      chooseOrder,
      chooseSubscription,
    }),
    [interest, productName, chooseOrder, chooseSubscription],
  );

  return (
    <LeadIntentContext.Provider value={value}>
      {children}
    </LeadIntentContext.Provider>
  );
}

export function useLeadIntent() {
  const context = useContext(LeadIntentContext);
  if (!context) {
    throw new Error("useLeadIntent нужно вызывать внутри LeadIntentProvider");
  }
  return context;
}
