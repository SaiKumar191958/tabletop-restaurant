import React, { createContext, useContext, ReactNode } from "react";
import { useRestaurantConfig, RestaurantConfig } from "./api-hooks";

interface RestaurantContextType {
  config: RestaurantConfig | undefined;
  isLoading: boolean;
  isError: boolean;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { data: config, isLoading, isError } = useRestaurantConfig();

  return (
    <RestaurantContext.Provider value={{ config, isLoading, isError }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}
