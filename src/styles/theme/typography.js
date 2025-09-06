/**
 * Typography Theme Configuration
 * Defines font families, sizes, weights, and typography scales for the application
 */

// Font Families
export const FONT_FAMILIES = {
  primary: [
    'Roboto',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Arial',
    'sans-serif'
  ].join(', '),
  
  secondary: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Arial',
    'sans-serif'
  ].join(', '),
  
  monospace: [
    'Monaco',
    'Menlo',
    'Consolas',
    '"Liberation Mono"',
    '"Courier New"',
    'monospace'
  ].join(', '),
  
  // Business-specific fonts
  electronics: [
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif'
  ].join(', '),
  
  furniture: [
    'Inter',
    'Georgia',
    'serif'
  ].join(', ')
};

// Font Weights
export const FONT_WEIGHTS = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800
};

// Font Sizes (in rem units)
export const FONT_SIZES = {
  xs: '0.75rem',      // 12px
  sm: '0.875rem',     // 14px
  base: '1rem',       // 16px (base size)
  lg: '1.125rem',     // 18px
  xl: '1.25rem',      // 20px
  '2xl': '1.5rem',    // 24px
  '3xl': '1.875rem',  // 30px
  '4xl': '2.25rem',   // 36px
  '5xl': '3rem',      // 48px
  '6xl': '3.75rem',   // 60px
  '7xl': '4.5rem',    // 72px
  '8xl': '6rem',      // 96px
  '9xl': '8rem'       // 128px
};

// Line Heights
export const LINE_HEIGHTS = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2'
};

// Letter Spacing
export const LETTER_SPACING = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em'
};

// Typography Scale for Material-UI
export const TYPOGRAPHY_SCALE = {
  htmlFontSize: 16,
  fontFamily: FONT_FAMILIES.primary,
  fontWeightLight: FONT_WEIGHTS.light,
  fontWeightRegular: FONT_WEIGHTS.regular,
  fontWeightMedium: FONT_WEIGHTS.medium,
  fontWeightBold: FONT_WEIGHTS.bold,
  
  // Display variants
  h1: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES['4xl'],
    lineHeight: LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.tight,
    '@media (max-width: 599px)': {
      fontSize: FONT_SIZES['3xl']
    }
  },
  
  h2: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES['3xl'],
    lineHeight: LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.tight,
    '@media (max-width: 599px)': {
      fontSize: FONT_SIZES['2xl']
    }
  },
  
  h3: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES['2xl'],
    lineHeight: LINE_HEIGHTS.snug,
    letterSpacing: LETTER_SPACING.normal,
    '@media (max-width: 599px)': {
      fontSize: FONT_SIZES.xl
    }
  },
  
  h4: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.xl,
    lineHeight: LINE_HEIGHTS.snug,
    letterSpacing: LETTER_SPACING.normal,
    '@media (max-width: 599px)': {
      fontSize: FONT_SIZES.lg
    }
  },
  
  h5: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.lg,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal
  },
  
  h6: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.base,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.wide
  },
  
  // Body text variants
  body1: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.regular,
    fontSize: FONT_SIZES.base,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal
  },
  
  body2: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.normal
  },
  
  // Subtitle variants
  subtitle1: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.base,
    lineHeight: LINE_HEIGHTS.snug,
    letterSpacing: LETTER_SPACING.wide
  },
  
  subtitle2: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.snug,
    letterSpacing: LETTER_SPACING.wide
  },
  
  // Caption and overline
  caption: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.wider
  },
  
  overline: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.xs,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.widest,
    textTransform: 'uppercase'
  },
  
  // Button text
  button: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.snug,
    letterSpacing: LETTER_SPACING.wide,
    textTransform: 'none'
  }
};

// Custom Typography Variants
export const CUSTOM_TYPOGRAPHY = {
  // Display variants
  display: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES['5xl'],
    lineHeight: LINE_HEIGHTS.none,
    letterSpacing: LETTER_SPACING.tight,
    '@media (max-width: 959px)': {
      fontSize: FONT_SIZES['4xl']
    },
    '@media (max-width: 599px)': {
      fontSize: FONT_SIZES['3xl']
    }
  },
  
  // Page titles
  pageTitle: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES['3xl'],
    lineHeight: LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.tight,
    '@media (max-width: 599px)': {
      fontSize: FONT_SIZES['2xl']
    }
  },
  
  // Section headings
  sectionHeading: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.xl,
    lineHeight: LINE_HEIGHTS.snug,
    letterSpacing: LETTER_SPACING.normal
  },
  
  // Card titles
  cardTitle: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.lg,
    lineHeight: LINE_HEIGHTS.snug
  },
  
  // Helper text
  helperText: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: LINE_HEIGHTS.normal,
    color: '#666666'
  },
  
  // Error text
  errorText: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: LINE_HEIGHTS.normal,
    color: '#f44336'
  },
  
  // Success text
  successText: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: LINE_HEIGHTS.normal,
    color: '#4caf50'
  },
  
  // Label text
  label: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.wide
  },
  
  // Data/numeric text
  numeric: {
    fontFamily: FONT_FAMILIES.monospace,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
    fontVariantNumeric: 'tabular-nums'
  },
  
  // Currency display
  currency: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.base,
    lineHeight: LINE_HEIGHTS.normal,
    fontVariantNumeric: 'tabular-nums'
  }
};

// Typography for Business Types
export const BUSINESS_TYPOGRAPHY = {
  electronics: {
    ...TYPOGRAPHY_SCALE,
    fontFamily: FONT_FAMILIES.electronics,
    h1: {
      ...TYPOGRAPHY_SCALE.h1,
      fontFamily: FONT_FAMILIES.electronics,
      letterSpacing: LETTER_SPACING.normal
    },
    h2: {
      ...TYPOGRAPHY_SCALE.h2,
      fontFamily: FONT_FAMILIES.electronics,
      letterSpacing: LETTER_SPACING.normal
    },
    h3: {
      ...TYPOGRAPHY_SCALE.h3,
      fontFamily: FONT_FAMILIES.electronics
    }
  },
  
  furniture: {
    ...TYPOGRAPHY_SCALE,
    fontFamily: FONT_FAMILIES.furniture,
    h1: {
      ...TYPOGRAPHY_SCALE.h1,
      fontFamily: FONT_FAMILIES.furniture,
      fontWeight: FONT_WEIGHTS.bold,
      letterSpacing: LETTER_SPACING.tight
    },
    h2: {
      ...TYPOGRAPHY_SCALE.h2,
      fontFamily: FONT_FAMILIES.furniture,
      letterSpacing: LETTER_SPACING.tight
    },
    h3: {
      ...TYPOGRAPHY_SCALE.h3,
      fontFamily: FONT_FAMILIES.furniture
    }
  }
};

// Typography Utilities
export const TYPOGRAPHY_UTILITIES = {
  // Text alignment
  textAlign: {
    left: 'left',
    center: 'center',
    right: 'right',
    justify: 'justify'
  },
  
  // Text decoration
  textDecoration: {
    none: 'none',
    underline: 'underline',
    lineThrough: 'line-through'
  },
  
  // Text transform
  textTransform: {
    none: 'none',
    capitalize: 'capitalize',
    uppercase: 'uppercase',
    lowercase: 'lowercase'
  },
  
  // White space
  whiteSpace: {
    normal: 'normal',
    nowrap: 'nowrap',
    pre: 'pre',
    preWrap: 'pre-wrap'
  },
  
  // Overflow
  overflow: {
    visible: 'visible',
    hidden: 'hidden',
    ellipsis: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    clamp: (lines) => ({
      display: '-webkit-box',
      WebkitLineClamp: lines,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    })
  }
};

// Responsive Typography
export const RESPONSIVE_TYPOGRAPHY = {
  // Fluid typography scales
  fluid: {
    h1: {
      fontSize: 'clamp(2rem, 5vw, 4rem)',
      lineHeight: LINE_HEIGHTS.tight
    },
    h2: {
      fontSize: 'clamp(1.75rem, 4vw, 3rem)',
      lineHeight: LINE_HEIGHTS.tight
    },
    h3: {
      fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
      lineHeight: LINE_HEIGHTS.snug
    },
    h4: {
      fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
      lineHeight: LINE_HEIGHTS.snug
    },
    body: {
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      lineHeight: LINE_HEIGHTS.normal
    }
  },
  
  // Breakpoint-specific adjustments
  breakpoints: {
    xs: {
      h1: { fontSize: FONT_SIZES['2xl'] },
      h2: { fontSize: FONT_SIZES.xl },
      h3: { fontSize: FONT_SIZES.lg },
      h4: { fontSize: FONT_SIZES.base },
      body1: { fontSize: FONT_SIZES.sm },
      body2: { fontSize: FONT_SIZES.xs }
    },
    sm: {
      h1: { fontSize: FONT_SIZES['3xl'] },
      h2: { fontSize: FONT_SIZES['2xl'] },
      h3: { fontSize: FONT_SIZES.xl },
      h4: { fontSize: FONT_SIZES.lg }
    },
    md: {
      h1: { fontSize: FONT_SIZES['4xl'] },
      h2: { fontSize: FONT_SIZES['3xl'] },
      h3: { fontSize: FONT_SIZES['2xl'] },
      h4: { fontSize: FONT_SIZES.xl }
    }
  }
};

// Print Typography
export const PRINT_TYPOGRAPHY = {
  h1: {
    ...TYPOGRAPHY_SCALE.h1,
    fontSize: '24pt',
    pageBreakAfter: 'avoid'
  },
  h2: {
    ...TYPOGRAPHY_SCALE.h2,
    fontSize: '20pt',
    pageBreakAfter: 'avoid'
  },
  h3: {
    ...TYPOGRAPHY_SCALE.h3,
    fontSize: '16pt',
    pageBreakAfter: 'avoid'
  },
  body1: {
    ...TYPOGRAPHY_SCALE.body1,
    fontSize: '11pt',
    lineHeight: '1.4'
  },
  body2: {
    ...TYPOGRAPHY_SCALE.body2,
    fontSize: '10pt',
    lineHeight: '1.3'
  }
};

// Typography Components
export const TYPOGRAPHY_COMPONENTS = {
  // Links
  link: {
    color: '#1976d2',
    textDecoration: 'none',
    fontWeight: FONT_WEIGHTS.medium,
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    '&:hover': {
      color: '#1565c0',
      textDecoration: 'underline'
    },
    '&:focus': {
      outline: '2px solid rgba(25, 118, 210, 0.3)',
      outlineOffset: '2px'
    }
  },
  
  // Code
  code: {
    fontFamily: FONT_FAMILIES.monospace,
    fontSize: '0.875em',
    backgroundColor: '#f5f5f5',
    padding: '0.125rem 0.25rem',
    borderRadius: '0.25rem',
    border: '1px solid #e0e0e0'
  },
  
  // Blockquote
  blockquote: {
    fontStyle: 'italic',
    borderLeft: '4px solid #1976d2',
    paddingLeft: '1rem',
    margin: '1rem 0',
    color: '#666'
  },
  
  // Form labels
  formLabel: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.wide,
    marginBottom: '0.5rem',
    display: 'block'
  },
  
  // Input text
  inputText: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.regular,
    fontSize: FONT_SIZES.base,
    lineHeight: LINE_HEIGHTS.normal
  },
  
  // Table header
  tableHeader: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
    letterSpacing: LETTER_SPACING.wide,
    textTransform: 'uppercase'
  },
  
  // Table cell
  tableCell: {
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal
  }
};

// Accessibility Typography
export const ACCESSIBILITY_TYPOGRAPHY = {
  // Minimum font sizes for readability
  minimumSizes: {
    mobile: '16px',  // Prevents zoom on iOS
    desktop: '14px'
  },
  
  // High contrast adjustments
  highContrast: {
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: LETTER_SPACING.wide
  },
  
  // Large text mode
  largeText: {
    scaleMultiplier: 1.25
  }
};

// Typography Mixins
export const TYPOGRAPHY_MIXINS = {
  // Truncate text
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  
  // Clamp text to specific lines
  clamp: (lines) => ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  }),
  
  // Responsive text size
  responsiveText: (minSize, maxSize) => ({
    fontSize: `clamp(${minSize}, 2.5vw, ${maxSize})`
  }),
  
  // Screen reader only text
  screenReaderOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0'
  }
};

// Typography for Specific Contexts
export const CONTEXT_TYPOGRAPHY = {
  // Dashboard
  dashboard: {
    pageTitle: {
      ...TYPOGRAPHY_SCALE.h2,
      fontWeight: FONT_WEIGHTS.bold,
      marginBottom: '0.5rem'
    },
    widgetTitle: {
      ...TYPOGRAPHY_SCALE.h6,
      fontWeight: FONT_WEIGHTS.semibold
    },
    statValue: {
      fontFamily: FONT_FAMILIES.primary,
      fontWeight: FONT_WEIGHTS.bold,
      fontSize: FONT_SIZES['2xl'],
      lineHeight: LINE_HEIGHTS.none,
      fontVariantNumeric: 'tabular-nums'
    },
    statLabel: {
      ...TYPOGRAPHY_SCALE.caption,
      color: '#666',
      textTransform: 'uppercase'
    }
  },
  
  // Forms
  forms: {
    fieldLabel: {
      ...CUSTOM_TYPOGRAPHY.label,
      marginBottom: '0.375rem'
    },
    helperText: {
      ...CUSTOM_TYPOGRAPHY.helperText,
      marginTop: '0.25rem'
    },
    errorText: {
      ...CUSTOM_TYPOGRAPHY.errorText,
      marginTop: '0.25rem'
    }
  },
  
  // Tables
  tables: {
    header: TYPOGRAPHY_COMPONENTS.tableHeader,
    cell: TYPOGRAPHY_COMPONENTS.tableCell,
    numeric: {
      ...TYPOGRAPHY_COMPONENTS.tableCell,
      fontFamily: FONT_FAMILIES.monospace,
      fontVariantNumeric: 'tabular-nums',
      textAlign: 'right'
    }
  },
  
  // Navigation
  navigation: {
    menuItem: {
      fontFamily: FONT_FAMILIES.primary,
      fontWeight: FONT_WEIGHTS.medium,
      fontSize: FONT_SIZES.sm,
      lineHeight: LINE_HEIGHTS.normal
    },
    breadcrumb: {
      fontFamily: FONT_FAMILIES.primary,
      fontWeight: FONT_WEIGHTS.regular,
      fontSize: FONT_SIZES.sm,
      lineHeight: LINE_HEIGHTS.normal
    }
  },
  
  // Invoice/Receipt
  invoice: {
    title: {
      fontFamily: FONT_FAMILIES.primary,
      fontWeight: FONT_WEIGHTS.bold,
      fontSize: FONT_SIZES['2xl'],
      letterSpacing: LETTER_SPACING.wide
    },
    companyName: {
      fontFamily: FONT_FAMILIES.primary,
      fontWeight: FONT_WEIGHTS.bold,
      fontSize: FONT_SIZES.lg
    },
    itemDescription: {
      fontFamily: FONT_FAMILIES.primary,
      fontWeight: FONT_WEIGHTS.regular,
      fontSize: FONT_SIZES.sm
    },
    totalAmount: {
      fontFamily: FONT_FAMILIES.primary,
      fontWeight: FONT_WEIGHTS.bold,
      fontSize: FONT_SIZES.lg,
      fontVariantNumeric: 'tabular-nums'
    }
  }
};

// Typography CSS Classes
export const TYPOGRAPHY_CLASSES = {
  '.text-xs': { fontSize: FONT_SIZES.xs },
  '.text-sm': { fontSize: FONT_SIZES.sm },
  '.text-base': { fontSize: FONT_SIZES.base },
  '.text-lg': { fontSize: FONT_SIZES.lg },
  '.text-xl': { fontSize: FONT_SIZES.xl },
  '.text-2xl': { fontSize: FONT_SIZES['2xl'] },
  '.text-3xl': { fontSize: FONT_SIZES['3xl'] },
  
  '.font-light': { fontWeight: FONT_WEIGHTS.light },
  '.font-normal': { fontWeight: FONT_WEIGHTS.regular },
  '.font-medium': { fontWeight: FONT_WEIGHTS.medium },
  '.font-semibold': { fontWeight: FONT_WEIGHTS.semibold },
  '.font-bold': { fontWeight: FONT_WEIGHTS.bold },
  
  '.leading-tight': { lineHeight: LINE_HEIGHTS.tight },
  '.leading-normal': { lineHeight: LINE_HEIGHTS.normal },
  '.leading-relaxed': { lineHeight: LINE_HEIGHTS.relaxed },
  
  '.tracking-tight': { letterSpacing: LETTER_SPACING.tight },
  '.tracking-normal': { letterSpacing: LETTER_SPACING.normal },
  '.tracking-wide': { letterSpacing: LETTER_SPACING.wide },
  
  '.text-truncate': TYPOGRAPHY_MIXINS.truncate,
  '.text-clamp-1': TYPOGRAPHY_MIXINS.clamp(1),
  '.text-clamp-2': TYPOGRAPHY_MIXINS.clamp(2),
  '.text-clamp-3': TYPOGRAPHY_MIXINS.clamp(3)
};

export default {
  FONT_FAMILIES,
  FONT_WEIGHTS,
  FONT_SIZES,
  LINE_HEIGHTS,
  LETTER_SPACING,
  TYPOGRAPHY_SCALE,
  CUSTOM_TYPOGRAPHY,
  BUSINESS_TYPOGRAPHY,
  TYPOGRAPHY_UTILITIES,
  RESPONSIVE_TYPOGRAPHY,
  PRINT_TYPOGRAPHY,
  TYPOGRAPHY_COMPONENTS,
  ACCESSIBILITY_TYPOGRAPHY,
  TYPOGRAPHY_MIXINS,
  CONTEXT_TYPOGRAPHY,
  TYPOGRAPHY_CLASSES
};