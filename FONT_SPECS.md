# Font Specifications for Figma Import

## Font Families

### Primary Font (Sans-serif)

- **Font Family**: Inter
- **Source**: Google Fonts
- **Fallbacks**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Usage**: Default body text, UI elements

### Monospace Font

- **Font Family**: JetBrains Mono
- **Source**: Google Fonts
- **Weights Available**: 400 (Regular), 500 (Medium)
- **Usage**: Timestamps, transcript text, code

---

## Text Styles

### Heading 1 (Page Title)

- **Font**: Inter
- **Size**: 24px (1.5rem)
- **Weight**: 500 (Medium)
- **Line Height**: Auto (default)
- **Usage**: "YouTube Transcript" page title

### Body Text - Small

- **Font**: Inter
- **Size**: 14px (0.875rem)
- **Weight**: 400 (Normal)
- **Line Height**: 20px (1.43)
- **Usage**: Description text, loading messages, error messages

### Body Text - Extra Small

- **Font**: Inter
- **Size**: 12px (0.75rem)
- **Weight**: 400 (Normal)
- **Line Height**: Auto
- **Usage**: Metadata, timestamps label, section headers

### Section Headers (Uppercase)

- **Font**: Inter
- **Size**: 12px (0.75rem)
- **Weight**: 500 (Medium)
- **Line Height**: Auto
- **Letter Spacing**: 0.05em (tracking-wider)
- **Text Transform**: Uppercase
- **Usage**: "Recent Searches", "History", "Transcript" section labels

### Button Text

- **Font**: Inter
- **Size**: 14px (0.875rem)
- **Weight**: 400 (Normal) - default
- **Weight**: 600 (Semibold) - for "Get Transcript" button
- **Line Height**: Auto
- **Usage**: All buttons

### Button Text - Small

- **Font**: Inter
- **Size**: 12px (0.75rem)
- **Weight**: 400 (Normal)
- **Line Height**: Auto
- **Usage**: Toggle buttons ("Timestamps", "No timestamps"), small buttons

### Card Title (History Items)

- **Font**: Inter
- **Size**: 12px (0.75rem)
- **Weight**: 500 (Medium)
- **Line Height**: 1.25 (leading-tight)
- **Usage**: Video titles in history sidebar

### Input Text

- **Font**: Inter
- **Size**: 14px (0.875rem) - mobile
- **Size**: 16px (1rem) - desktop default
- **Weight**: 400 (Normal)
- **Line Height**: Auto
- **Usage**: URL input field

---

## Monospace Text Styles

### Timestamp

- **Font**: JetBrains Mono
- **Size**: 12px (0.75rem)
- **Weight**: 400 (Regular)
- **Line Height**: Auto
- **Number Style**: Tabular (tabular-nums)
- **Usage**: Timestamp labels (e.g., "0:00", "0:02")

### Transcript Text

- **Font**: JetBrains Mono
- **Size**: 14px (0.875rem)
- **Weight**: 400 (Regular)
- **Line Height**: 22.75px (1.625 / leading-relaxed)
- **Usage**: Main transcript content

---

## Color Specifications

> **Note**: Dark theme is the default theme in this application.

---

### 🎨 Dark Theme Colors (Default)

#### Background Colors

- **Background**: `#0A0A0A` - Main page background
- **Card**: `#0A0A0A` - Card/container backgrounds
- **Popover**: `#0A0A0A` - Popover/dropdown backgrounds
- **Input**: `#262626` - Input field backgrounds
- **Muted**: `#262626` - Muted/disabled backgrounds
- **Secondary**: `#262626` - Secondary backgrounds
- **Accent**: `#262626` - Accent/hover backgrounds
- **Sidebar**: `#171717` - Sidebar background

#### Text Colors

- **Foreground**: `#FFFFFF` - Primary text color
- **Card Foreground**: `#FFFFFF` - Text on cards
- **Muted Foreground**: `#A3A3A3` - Secondary/muted text
- **Secondary Foreground**: `#FFFFFF` - Text on secondary backgrounds
- **Accent Foreground**: `#FFFFFF` - Text on accent backgrounds
- **Sidebar Foreground**: `#F5F5F5` - Sidebar text
- **Sidebar Accent Foreground**: `#F5F5F5` - Sidebar accent text

#### Semantic Colors

- **Primary**: `#FFFFFF` - Primary actions/elements
- **Primary Foreground**: `#171717` - Text on primary
- **Destructive**: `#7F1D1D` - Error/destructive actions
- **Destructive Foreground**: `#FFFFFF` - Text on destructive

#### Border Colors

- **Border**: `#262626` - Default borders
- **Input Border**: `#262626` - Input field borders
- **Sidebar Border**: `#262626` - Sidebar borders

#### Interactive Colors

- **Ring**: `#D4D4D4` - Focus ring color
- **Sidebar Ring**: `#3B82F6` - Sidebar focus ring (blue)
- **Sidebar Primary**: `#3B82F6` - Sidebar primary accent (blue)

---

### ☀️ Light Theme Colors

#### Background Colors

- **Background**: `#FFFFFF` - Main page background
- **Card**: `#FFFFFF` - Card/container backgrounds
- **Popover**: `#FFFFFF` - Popover/dropdown backgrounds
- **Input**: `#E5E5E5` - Input field backgrounds
- **Muted**: `#F5F5F5` - Muted/disabled backgrounds
- **Secondary**: `#F5F5F5` - Secondary backgrounds
- **Accent**: `#F5F5F5` - Accent/hover backgrounds
- **Sidebar**: `#FAFAFA` - Sidebar background

#### Text Colors

- **Foreground**: `#0A0A0A` - Primary text color
- **Card Foreground**: `#0A0A0A` - Text on cards
- **Muted Foreground**: `#737373` - Secondary/muted text
- **Secondary Foreground**: `#171717` - Text on secondary backgrounds
- **Accent Foreground**: `#171717` - Text on accent backgrounds
- **Sidebar Foreground**: `#424242` - Sidebar text

#### Semantic Colors

- **Primary**: `#171717` - Primary actions/elements
- **Primary Foreground**: `#FAFAFA` - Text on primary
- **Destructive**: `#DC2626` - Error/destructive actions
- **Destructive Foreground**: `#FAFAFA` - Text on destructive

#### Border Colors

- **Border**: `#E5E5E5` - Default borders
- **Input Border**: `#E5E5E5` - Input field borders
- **Sidebar Border**: `#E8E8E8` - Sidebar borders

#### Interactive Colors

- **Ring**: `#0A0A0A` - Focus ring color
- **Sidebar Ring**: `#3B82F6` - Sidebar focus ring (blue)
- **Sidebar Primary**: `#171717` - Sidebar primary accent

---

### 🎯 Opacity Variations (Dark Theme)

These are used with opacity modifiers in Tailwind:

- **Muted Foreground / 50%**: `#FFFFFF` at 50% opacity = `rgba(255, 255, 255, 0.5)`
- **Muted Foreground / 70%**: `#FFFFFF` at 70% opacity = `rgba(255, 255, 255, 0.7)`
- **Accent / 30%**: `#262626` at 30% opacity = `rgba(38, 38, 38, 0.3)`
- **Accent / 50%**: `#262626` at 50% opacity = `rgba(38, 38, 38, 0.5)`
- **Destructive / 20%**: `#7F1D1D` at 20% opacity = `rgba(127, 29, 29, 0.2)`
- **Input / 90%**: `#262626` at 90% opacity = `rgba(38, 38, 38, 0.9)`

---

### 📊 Chart Colors (Dark Theme)

- **Chart 1**: `#3B82F6` (Blue)
- **Chart 2**: `#22C55E` (Green)
- **Chart 3**: `#F59E0B` (Orange)
- **Chart 4**: `#A855F7` (Purple)
- **Chart 5**: `#EF4444` (Red)

---

### 🎭 Shadow Specifications

#### Light Theme Shadows

- **Color**: `#000000` (black)
- **Opacity**: 5% (0.05)
- **Shadow Layered**:
  - `0 2px 4px -1px rgba(0, 0, 0, 0.05)`
  - `0 0.5px 0 rgba(255, 255, 255, 0.05)`
- **Shadow Layered Medium**:
  - `0 4px 8px -2px rgba(0, 0, 0, 0.05)`
  - `0 0.5px 0 rgba(255, 255, 255, 0.05)`

#### Dark Theme Shadows

- **Color**: `#000000` (black)
- **Opacity**: 20% (0.2)
- **Shadow Layered**:
  - `0 2px 4px -1px rgba(0, 0, 0, 0.08)`
  - `0 0.5px 0 rgba(255, 255, 255, 0.04)`
- **Shadow Layered Medium**:
  - `0 4px 8px -2px rgba(0, 0, 0, 0.1)`
  - `0 0.5px 0 rgba(255, 255, 255, 0.05)`

---

### 📐 Border Radius

- **Radius (Default)**: `8px` (0.5rem)
- **Radius Small**: `4px` (calc(0.5rem - 4px))
- **Radius Medium**: `6px` (calc(0.5rem - 2px))
- **Radius Large**: `8px` (0.5rem)
- **Radius XL**: `12px` (calc(0.5rem + 4px))

---

### 🎨 Color Usage Guide

| Element          | Dark Theme              | Light Theme          | Notes                |
| ---------------- | ----------------------- | -------------------- | -------------------- |
| Page Background  | `#0A0A0A`               | `#FFFFFF`            | Main background      |
| Primary Text     | `#FFFFFF`               | `#0A0A0A`            | Body text, headings  |
| Muted Text       | `#A3A3A3`               | `#737373`            | Secondary text       |
| Muted Text (50%) | `rgba(255,255,255,0.5)` | `rgba(10,10,10,0.5)` | Section headers      |
| Muted Text (70%) | `rgba(255,255,255,0.7)` | `rgba(10,10,10,0.7)` | Metadata             |
| Card Background  | `#0A0A0A`               | `#FFFFFF`            | Card containers      |
| Input Background | `#262626`               | `#E5E5E5`            | Input fields         |
| Border           | `#262626`               | `#E5E5E5`            | All borders          |
| Button Default   | `#262626` bg            | `#E5E5E5` bg         | Button background    |
| Button Hover     | `#262626` at 90%        | `#E5E5E5` at 90%     | Button hover         |
| Accent Hover     | `#262626` at 30%        | `#F5F5F5`            | Hover states         |
| Focus Ring       | `#D4D4D4`               | `#0A0A0A`            | Focus indicators     |
| Destructive      | `#7F1D1D`               | `#DC2626`            | Error/delete actions |

---

## Figma Import Instructions

### 1. Installing Fonts in Figma

**Option A: Using Figma's Fonts**

- **Inter**: Already available in Figma (use "Inter" family)
- **JetBrains Mono**: Install from Google Fonts or use Figma Community plugin

**Option B: Importing Google Fonts**

- Go to Figma → Plugins → Search "Google Fonts"
- Install fonts: Inter and JetBrains Mono
- Or download from [fonts.google.com](https://fonts.google.com) and install locally

---

### 2. Creating Color Styles in Figma

Create color styles organized by theme:

**Dark Theme Colors:**

- Create a "Dark Theme" color style group
- Add all colors from the Dark Theme section above
- Name them: `Background`, `Foreground`, `Muted`, `Border`, etc.

**Light Theme Colors:**

- Create a "Light Theme" color style group
- Add all colors from the Light Theme section above

**Opacity Variations:**

- Create separate color styles for opacity variations
- Use Figma's color opacity feature or create RGBA colors directly

**Quick Setup:**

1. Right-click on any color → "Add style"
2. Name: `Color/Dark/Background` = `#0A0A0A`
3. Name: `Color/Dark/Foreground` = `#FFFFFF`
4. Name: `Color/Dark/Muted` = `#A3A3A3`
5. Continue for all colors...

**Pro Tip**: Use naming convention: `Color/[Theme]/[Name]` for easy organization

---

### 3. Creating Text Styles

Create text styles organized by hierarchy:

**Naming Convention:** `[Category]/[Size]/[Weight]` or `[Usage]/[Size]`

**Examples:**

- `Heading/H1` - 24px, Medium, Inter
- `Body/Small` - 14px, Normal, Inter
- `Body/XS` - 12px, Normal, Inter
- `Section/Header` - 12px, Medium, Uppercase, Inter
- `Code/Timestamp` - 12px, Regular, JetBrains Mono
- `Code/Transcript` - 14px, Regular, JetBrains Mono

**Steps:**

1. Create a text element with desired styling
2. Right-click → "Add text style"
3. Name according to convention
4. Repeat for all text styles

---

### 4. Font Size Reference

| Tailwind Class | Size            | Usage                  |
| -------------- | --------------- | ---------------------- |
| `text-xs`      | 12px (0.75rem)  | Small labels, metadata |
| `text-sm`      | 14px (0.875rem) | Body text, buttons     |
| `text-base`    | 16px (1rem)     | Input fields (desktop) |
| `text-2xl`     | 24px (1.5rem)   | Page headings          |

---

### 5. Font Weight Reference

| Weight | Class          | Usage                     |
| ------ | -------------- | ------------------------- |
| 400    | Normal/Regular | Default body text         |
| 500    | Medium         | Headings, emphasized text |
| 600    | Semibold       | Button text (optional)    |

---

### 6. Line Height Reference

| Class             | Value | Usage           |
| ----------------- | ----- | --------------- |
| Default           | Auto  | Most text       |
| `leading-tight`   | 1.25  | Card titles     |
| `leading-relaxed` | 1.625 | Transcript text |

---

### 7. Border Radius Reference

| Class       | Size | Usage                    |
| ----------- | ---- | ------------------------ |
| `radius-sm` | 4px  | Small elements           |
| `radius-md` | 6px  | Medium elements          |
| `radius-lg` | 8px  | Default (cards, buttons) |
| `radius-xl` | 12px | Large elements           |

---

### 8. Quick Import Checklist

- [ ] Install Inter font (or use Figma's built-in)
- [ ] Install JetBrains Mono font
- [ ] Create Dark Theme color styles
- [ ] Create Light Theme color styles (optional)
- [ ] Create all text styles
- [ ] Set up border radius styles (if using Figma variables)
- [ ] Test styles on sample components

---

## Quick Reference Table

| Style          | Font           | Size | Weight  | Line Height | Usage                      |
| -------------- | -------------- | ---- | ------- | ----------- | -------------------------- |
| H1             | Inter          | 24px | 500     | Auto        | Page title                 |
| Body/Small     | Inter          | 14px | 400     | 20px        | Descriptions, errors       |
| Body/XS        | Inter          | 12px | 400     | Auto        | Metadata, labels           |
| Section Header | Inter          | 12px | 500     | Auto        | Section labels (uppercase) |
| Button         | Inter          | 14px | 400-600 | Auto        | Buttons                    |
| Button/Small   | Inter          | 12px | 400     | Auto        | Toggle buttons             |
| Card Title     | Inter          | 12px | 500     | 1.25        | History items              |
| Timestamp      | JetBrains Mono | 12px | 400     | Auto        | Timestamps                 |
| Transcript     | JetBrains Mono | 14px | 400     | 22.75px     | Transcript text            |
