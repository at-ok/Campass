import { createContext, useContext, useState, type ReactNode } from "react";
const Context = createContext<{
  date: Date;
  setDate: (date: Date) => void;
} | null>(null);
export function PlannerDateProvider({ children }: { children: ReactNode }) {
  const [date, setDate] = useState(new Date());
  return (
    <Context.Provider value={{ date, setDate }}>{children}</Context.Provider>
  );
}
export function usePlannerDate() {
  const value = useContext(Context);
  if (!value) throw new Error("PlannerDateProvider is missing");
  return value;
}
