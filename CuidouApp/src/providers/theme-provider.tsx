import { PropsWithChildren, createContext, useContext } from "react";

import { appTheme } from "@/constants/theme";

const ThemeContext = createContext(appTheme);

export function AppThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeContext.Provider value={appTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
