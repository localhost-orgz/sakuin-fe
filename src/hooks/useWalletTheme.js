import { useMemo } from "react";

export const WALLET_THEMES = {
  ocean: {
    id: "ocean",
    label: "Ocean",
    gradientColors: ["#0c2233", "#0f3a52"],
    accentColor: "#0ea5e9",
    bgColor: "#F0F9FF",
    shadowColor: "#0ea5e9",
    textColor: "#0369a1",
    cardColor: "#1A9FD4",
    cardColorBack: "#0F6A93",
    iconBgColor: "#D6F0FF",
  },
  forest: {
    id: "forest",
    label: "Forest",
    gradientColors: ["#0a2218", "#0d3324"],
    accentColor: "#22c55e",
    bgColor: "#F0FDF4",
    shadowColor: "#22c55e",
    textColor: "#15803d",
    cardColor: "#1DB954",
    cardColorBack: "#117A38",
    iconBgColor: "#D7F5E4",
  },
  ember: {
    id: "ember",
    label: "Ember",
    gradientColors: ["#2a1200", "#3d1f08"],
    accentColor: "#f97316",
    bgColor: "#FFF4E5",
    shadowColor: "#f97316",
    textColor: "#c2410c",
    cardColor: "#E8620A",
    cardColorBack: "#A84208",
    iconBgColor: "#FFE2C2",
  },
  violet: {
    id: "violet",
    label: "Violet",
    gradientColors: ["#1a0a2e", "#280f45"],
    accentColor: "#a855f7",
    bgColor: "#FDF4FF",
    shadowColor: "#a855f7",
    textColor: "#7e22ce",
    cardColor: "#7B3FD4",
    cardColorBack: "#4E1F96",
    iconBgColor: "#F4D8FF",
  },
  indigo: {
    id: "indigo",
    label: "Indigo",
    gradientColors: ["#0f0f2e", "#181840"],
    accentColor: "#6366f1",
    bgColor: "#EEF2FF",
    shadowColor: "#6366f1",
    textColor: "#4338ca",
    cardColor: "#4F52E0",
    cardColorBack: "#2D2FA8",
    iconBgColor: "#D9DEFF",
  },
  rose: {
    id: "rose",
    label: "Rose",
    gradientColors: ["#2a0a12", "#3d0f1c"],
    accentColor: "#f43f5e",
    bgColor: "#FFF1F2",
    shadowColor: "#f43f5e",
    textColor: "#be123c",
    cardColor: "#E8244A",
    cardColorBack: "#A3122E",
    iconBgColor: "#FFD6DB",
  },
};

const FALLBACK_THEME = WALLET_THEMES.ocean;

export const getWalletTheme = (themeId) =>
  WALLET_THEMES[themeId] ?? FALLBACK_THEME;

export const getWalletColor = (themeId, colorKey) =>
  getWalletTheme(themeId)[colorKey];

export const getWalletGradient = (themeId, direction = "135deg") => {
  const { gradientColors } = getWalletTheme(themeId);
  return `linear-gradient(${direction}, ${gradientColors[0]}, ${gradientColors[1]})`;
};

export const getWalletThemeIds = () => Object.keys(WALLET_THEMES);

export const useWalletTheme = (themeId) => {
  const theme = useMemo(() => getWalletTheme(themeId), [themeId]);

  const getColor = useMemo(
    () => (colorKey) => theme[colorKey],
    [theme]
  );

  const gradient = useMemo(
    () => (direction = "135deg") =>
      `linear-gradient(${direction}, ${theme.gradientColors[0]}, ${theme.gradientColors[1]})`,
    [theme]
  );

  return {
    theme,
    getColor,
    gradient,
    allThemeIds: getWalletThemeIds(),
  };
};

export default useWalletTheme;
