import { Theme } from '@rainbow-me/rainbowkit';

// Convert OKLCH colors to hex for RainbowKit compatibility
const lightColors = {
  background: '#fcfcfc',        // oklch(0.99 0 0)
  foreground: '#000000',        // oklch(0 0 0)
  card: '#ffffff',              // oklch(1 0 0)
  cardForeground: '#000000',    // oklch(0 0 0)
  popover: '#fcfcfc',           // oklch(0.99 0 0)
  popoverForeground: '#000000', // oklch(0 0 0)
  primary: '#000000',           // oklch(0 0 0)
  primaryForeground: '#ffffff', // oklch(1 0 0)
  secondary: '#efefef',         // oklch(0.94 0 0)
  secondaryForeground: '#000000', // oklch(0 0 0)
  muted: '#f8f8f8',            // oklch(0.97 0 0)
  mutedForeground: '#707070',   // oklch(0.44 0 0)
  accent: '#efefef',            // oklch(0.94 0 0)
  accentForeground: '#000000',  // oklch(0 0 0)
  destructive: '#dc2626',       // oklch(0.63 0.19 23.03)
  destructiveForeground: '#ffffff', // oklch(1 0 0)
  border: '#eaeaea',            // oklch(0.92 0 0)
  input: '#efefef',             // oklch(0.94 0 0)
  ring: '#000000',              // oklch(0 0 0)
};

const darkColors = {
  background: '#000000',        // oklch(0 0 0)
  foreground: '#ffffff',        // oklch(1 0 0)
  card: '#242424',              // oklch(0.14 0 0)
  cardForeground: '#ffffff',    // oklch(1 0 0)
  popover: '#2e2e2e',           // oklch(0.18 0 0)
  popoverForeground: '#ffffff', // oklch(1 0 0)
  primary: '#ffffff',           // oklch(1 0 0)
  primaryForeground: '#000000', // oklch(0 0 0)
  secondary: '#404040',         // oklch(0.25 0 0)
  secondaryForeground: '#ffffff', // oklch(1 0 0)
  muted: '#3a3a3a',            // oklch(0.23 0 0)
  mutedForeground: '#b8b8b8',   // oklch(0.72 0 0)
  accent: '#515151',            // oklch(0.32 0 0)
  accentForeground: '#ffffff',  // oklch(1 0 0)
  destructive: '#ef4444',       // oklch(0.69 0.2 23.91)
  destructiveForeground: '#000000', // oklch(0 0 0)
  border: '#424242',            // oklch(0.26 0 0)
  input: '#515151',             // oklch(0.32 0 0)
  ring: '#b8b8b8',              // oklch(0.72 0 0)
};

export const lightTheme = (): Theme => ({
  blurs: {
    modalOverlay: 'blur(4px)',
  },
  colors: {
    accentColor: lightColors.primary,
    accentColorForeground: lightColors.primaryForeground,
    actionButtonBorder: lightColors.border,
    actionButtonBorderMobile: lightColors.border,
    actionButtonSecondaryBackground: lightColors.secondary,
    closeButton: lightColors.mutedForeground,
    closeButtonBackground: lightColors.muted,
    connectButtonBackground: lightColors.card,
    connectButtonBackgroundError: lightColors.destructive,
    connectButtonInnerBackground: lightColors.background,
    connectButtonText: lightColors.foreground,
    connectButtonTextError: lightColors.destructiveForeground,
    connectionIndicator: '#10b981', // emerald-500
    downloadBottomCardBackground: lightColors.card,
    downloadTopCardBackground: lightColors.background,
    error: lightColors.destructive,
    generalBorder: lightColors.border,
    generalBorderDim: lightColors.muted,
    menuItemBackground: lightColors.secondary,
    modalBackdrop: 'rgba(0, 0, 0, 0.3)',
    modalBackground: lightColors.background,
    modalBorder: lightColors.border,
    modalText: lightColors.foreground,
    modalTextDim: lightColors.mutedForeground,
    modalTextSecondary: lightColors.mutedForeground,
    profileAction: lightColors.secondary,
    profileActionHover: lightColors.accent,
    profileForeground: lightColors.card,
    selectedOptionBorder: lightColors.primary,
    standby: '#fbbf24', // amber-400
  },
  fonts: {
    body: 'Geist, sans-serif',
  },
  radii: {
    actionButton: '0.375rem', // 6px
    connectButton: '0.375rem', // 6px
    menuButton: '0.375rem', // 6px
    modal: '0.375rem', // 6px
    modalMobile: '0.375rem', // 6px
  },
  shadows: {
    connectButton: '0px 1px 2px 0px rgba(0, 0, 0, 0.18), 0px 1px 2px -1px rgba(0, 0, 0, 0.18)',
    dialog: '0px 1px 2px 0px rgba(0, 0, 0, 0.18), 0px 4px 6px -1px rgba(0, 0, 0, 0.18)',
    profileDetailsAction: '0px 1px 2px 0px rgba(0, 0, 0, 0.18), 0px 2px 4px -1px rgba(0, 0, 0, 0.18)',
    selectedOption: '0px 1px 2px 0px rgba(0, 0, 0, 0.18), 0px 2px 4px -1px rgba(0, 0, 0, 0.18)',
    selectedWallet: '0px 1px 2px 0px rgba(0, 0, 0, 0.18), 0px 2px 4px -1px rgba(0, 0, 0, 0.18)',
    walletLogo: '0px 1px 2px 0px rgba(0, 0, 0, 0.09)',
  },
});

export const darkTheme = (): Theme => ({
  blurs: {
    modalOverlay: 'blur(4px)',
  },
  colors: {
    accentColor: darkColors.primary,
    accentColorForeground: darkColors.primaryForeground,
    actionButtonBorder: darkColors.border,
    actionButtonBorderMobile: darkColors.border,
    actionButtonSecondaryBackground: darkColors.secondary,
    closeButton: darkColors.mutedForeground,
    closeButtonBackground: darkColors.muted,
    connectButtonBackground: darkColors.card,
    connectButtonBackgroundError: darkColors.destructive,
    connectButtonInnerBackground: darkColors.background,
    connectButtonText: darkColors.foreground,
    connectButtonTextError: darkColors.destructiveForeground,
    connectionIndicator: '#10b981', // emerald-500
    downloadBottomCardBackground: darkColors.card,
    downloadTopCardBackground: darkColors.background,
    error: darkColors.destructive,
    generalBorder: darkColors.border,
    generalBorderDim: darkColors.muted,
    menuItemBackground: darkColors.secondary,
    modalBackdrop: 'rgba(0, 0, 0, 0.6)',
    modalBackground: darkColors.background,
    modalBorder: darkColors.border,
    modalText: darkColors.foreground,
    modalTextDim: darkColors.mutedForeground,
    modalTextSecondary: darkColors.mutedForeground,
    profileAction: darkColors.secondary,
    profileActionHover: darkColors.accent,
    profileForeground: darkColors.card,
    selectedOptionBorder: darkColors.primary,
    standby: '#fbbf24', // amber-400
  },
  fonts: {
    body: 'Geist, sans-serif',
  },
  radii: {
    actionButton: '0.375rem', // 6px
    connectButton: '0.375rem', // 6px
    menuButton: '0.375rem', // 6px
    modal: '0.375rem', // 6px
    modalMobile: '0.375rem', // 6px
  },
  shadows: {
    connectButton: '0px 1px 2px 0px rgba(0, 0, 0, 0.18), 0px 1px 2px -1px rgba(0, 0, 0, 0.18)',
    dialog: '0px 1px 2px 0px rgba(0, 0, 0, 0.18), 0px 4px 6px -1px rgba(0, 0, 0, 0.18)',
    profileDetailsAction: '0px 1px 2px 0px rgba(0, 0, 0, 0.18), 0px 2px 4px -1px rgba(0, 0, 0, 0.18)',
    selectedOption: '0px 1px 2px 0px rgba(0, 0, 0, 0.18), 0px 2px 4px -1px rgba(0, 0, 0, 0.18)',
    selectedWallet: '0px 1px 2px 0px rgba(0, 0, 0, 0.18), 0px 2px 4px -1px rgba(0, 0, 0, 0.18)',
    walletLogo: '0px 1px 2px 0px rgba(0, 0, 0, 0.09)',
  },
});