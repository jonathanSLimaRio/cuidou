import { ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import { PropsWithChildren, createContext, useContext } from "react";

import { appTheme, navigationTheme } from "@/constants/theme";

const ThemeContext = createContext(appTheme);

export function AppThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeContext.Provider value={appTheme}>
      <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
