# Figma Input Field Design Specifications

Based on the provided HTML/CSS code, here are the specifications needed to reproduce this input field design in Figma.

---

## Colors

### Light Mode Colors
- **Background (Page)**: `#F3F4F6` (gray-100)
- **Input Background**: `#FFFFFF` (white)
- **Text**: `#171717` (default text color)
- **Placeholder**: `#9CA3AF` (neutral-400)
- **Border**: `rgba(0, 0, 0, 0.05)` (black/5)
- **Focus Border**: `#3B82F6` (blue-500)

### Dark Mode Colors
- **Background (Page)**: `#262626` (neutral-800)
- **Input Background**: `#313131` (neutral-750)
- **Text**: `#E5E5E5` (neutral-200)
- **Placeholder**: `#737373` (neutral-500)
- **Border**: `rgba(0, 0, 0, 0.05)` (black/5)
- **Focus Border**: `#3B82F6` (blue-500)

---

## Typography

- **Font Size**: `14px` (text-sm)
- **Font Family**: Use your default sans-serif (Inter recommended)
- **Font Weight**: `400` (Regular/Normal)
- **Line Height**: Auto/default

---

## Dimensions & Spacing

- **Padding**: 
  - Horizontal: `14px` (px-3.5)
  - Vertical: `8px` (py-2)
- **Border Radius**: `8px` (rounded-lg)
- **Border Width**: `1px`

---

## Shadows - Exact Figma Specifications

### Input Shadow (Default State)

**Light Mode - 5 Shadow Layers:**

Apply these shadows in order from top to bottom:

1. **Shadow Layer 1**
   - X: `0`
   - Y: `1`
   - Blur: `0`
   - Spread: `-1`
   - Color: `rgba(0, 0, 0, 0.05)` or `#000000` at 5% opacity
   - Type: Drop shadow

2. **Shadow Layer 2**
   - X: `0`
   - Y: `1`
   - Blur: `1`
   - Spread: `-1`
   - Color: `rgba(0, 0, 0, 0.05)` or `#000000` at 5% opacity
   - Type: Drop shadow

3. **Shadow Layer 3**
   - X: `0`
   - Y: `1`
   - Blur: `2`
   - Spread: `-1`
   - Color: `rgba(0, 0, 0, 0.05)` or `#000000` at 5% opacity
   - Type: Drop shadow

4. **Shadow Layer 4**
   - X: `0`
   - Y: `2`
   - Blur: `4`
   - Spread: `-2`
   - Color: `rgba(0, 0, 0, 0.05)` or `#000000` at 5% opacity
   - Type: Drop shadow

5. **Shadow Layer 5**
   - X: `0`
   - Y: `3`
   - Blur: `6`
   - Spread: `-3`
   - Color: `rgba(0, 0, 0, 0.05)` or `#000000` at 5% opacity
   - Type: Drop shadow

**Dark Mode - Same Structure, Different Opacity:**

Use the same X, Y, Blur, Spread values but change color to:
- Color: `rgba(0, 0, 0, 0.10)` or `#000000` at 10% opacity
- Apply to all 5 layers

---

### Focus Ring Shadow (Outer Ring)

**Applied to the focus ring element (before pseudo-element):**

- X: `0`
- Y: `0`
- Blur: `2`
- Spread: `0`
- Color: `rgba(59, 130, 246, 0.2)` or `#3B82F6` at 20% opacity
- Type: Drop shadow

---

### Inner Highlight Shadow (Focus State)

**Light Mode - 2 Inset Shadow Layers:**

Apply these as **inset** shadows to the inner highlight element:

1. **Shadow Layer 1 (Inset)**
   - X: `0`
   - Y: `0`
   - Blur: `0`
   - Spread: `1`
   - Color: `rgba(255, 255, 255, 0.05)` or `#FFFFFF` at 5% opacity
   - Type: **Inner shadow** (inset)

2. **Shadow Layer 2 (Inset)**
   - X: `0`
   - Y: `1`
   - Blur: `0`
   - Spread: `0`
   - Color: `rgba(255, 255, 255, 0.05)` or `#FFFFFF` at 5% opacity
   - Type: **Inner shadow** (inset)

**Dark Mode - Focus State:**

1. **Shadow Layer 1 (Inset)**
   - X: `0`
   - Y: `0`
   - Blur: `0`
   - Spread: `1`
   - Color: `rgba(59, 130, 246, 1.0)` or `#3B82F6` at 100% opacity
   - Type: **Inner shadow** (inset)

2. **Shadow Layer 2 (Inset)**
   - X: `0`
   - Y: `1`
   - Blur: `0`
   - Spread: `0`
   - Color: `rgba(59, 130, 246, 0.2)` or `#3B82F6` at 20% opacity
   - Type: **Inner shadow** (inset)

---

## Focus State Design

### Focus Ring (Before Pseudo-element)
Create a separate frame/component for the focus state:

**Position**: `-4px` offset from input (-inset-1 = -4px)

**Dimensions**: 
- Width: Input width + 8px
- Height: Input height + 8px

**Border Radius**: `11px`

**Border**:
- Width: `1px`
- Color: `#3B82F6` (blue-500)

**Ring Shadow**:
- Offset: `0px, 0px`
- Blur: `2px`
- Spread: `0px`
- Color: `rgba(59, 130, 246, 0.2)` (blue-500/20)

**Opacity**: 
- Default: `0` (hidden)
- Focus: `100` (visible)

### Inner Highlight (After Pseudo-element)
Create another layer for the inner highlight:

**Position**: `1px` inset from input edges

**Dimensions**: 
- Width: Input width - 2px
- Height: Input height - 2px

**Border Radius**: `7px`

**Shadow**: Use the highlight shadow specified above

---

## Figma Implementation Steps

### 1. Create Input Component

1. **Base Frame**:
   - Create a frame with rounded corners (`8px`)
   - Set background color based on theme
   - Add border: `1px solid rgba(0, 0, 0, 0.05)`

2. **Add Text Layer**:
   - Create a text layer inside the frame
   - Font: Inter, 14px, Regular
   - Color: Text color based on theme
   - Add placeholder text with appropriate color

3. **Apply Padding**:
   - Add auto-layout to the frame
   - Set padding: `8px` vertical, `14px` horizontal

4. **Add Shadows**:
   - Apply the 5-layer shadow effect
   - Use the shadow specifications above

### 2. Create Focus State Variant

1. **Duplicate Input Component**:
   - Create a variant for focus state

2. **Add Focus Ring**:
   - Create a rectangle behind the input
   - Position: `-4px` offset on all sides
   - Size: Input size + 8px
   - Border: `1px solid #3B82F6`
   - Border Radius: `11px`
   - Add ring shadow: `0px 0px 2px rgba(59, 130, 246, 0.2)`

3. **Add Inner Highlight**:
   - Create a rectangle inside the input
   - Position: `1px` inset from edges
   - Border Radius: `7px`
   - Apply inset shadows as specified

4. **Update Border**:
   - Change border color to `#3B82F6` on focus

### 3. Create Component Variants

Create separate variants for:
- **Light Mode** (Default)
- **Dark Mode**
- **Light Mode Focus**
- **Dark Mode Focus**

### 4. Component Properties

Set up component properties:
- **Theme**: Variant (Light/Dark)
- **State**: Variant (Default/Focus)
- **Placeholder**: Text (editable)

---

## Figma Shadow Settings Quick Reference

### Input Shadow (Light Mode)
```
Shadow 1: 
  X: 0, Y: 1, Blur: 0, Spread: -1, Color: rgba(0,0,0,0.05)

Shadow 2:
  X: 0, Y: 1, Blur: 1, Spread: -1, Color: rgba(0,0,0,0.05)

Shadow 3:
  X: 0, Y: 1, Blur: 2, Spread: -1, Color: rgba(0,0,0,0.05)

Shadow 4:
  X: 0, Y: 2, Blur: 4, Spread: -2, Color: rgba(0,0,0,0.05)

Shadow 5:
  X: 0, Y: 3, Blur: 6, Spread: -3, Color: rgba(0,0,0,0.05)
```

### Input Shadow (Dark Mode)
Same as above but use `rgba(0,0,0,0.10)` for all colors.

### Focus Ring Shadow
```
X: 0, Y: 0, Blur: 2, Spread: 0, Color: rgba(59,130,246,0.2)
```

### Inner Highlight Shadow (Light Mode - Focus)
```
Shadow 1 (inset):
  X: 0, Y: 0, Blur: 0, Spread: 1, Color: rgba(255,255,255,0.05), Inset: ✓

Shadow 2 (inset):
  X: 0, Y: 1, Blur: 0, Spread: 0, Color: rgba(255,255,255,0.05), Inset: ✓
```

### Inner Highlight Shadow (Dark Mode - Focus)
```
Shadow 1 (inset):
  X: 0, Y: 0, Blur: 0, Spread: 1, Color: rgba(59,130,246,1.0), Inset: ✓

Shadow 2 (inset):
  X: 0, Y: 1, Blur: 0, Spread: 0, Color: rgba(59,130,246,0.2), Inset: ✓
```

---

## Color Style Names for Figma

Create these color styles:

**Light Mode:**
- `Input/BG` = `#FFFFFF`
- `Input/Border` = `rgba(0, 0, 0, 0.05)`
- `Input/Text` = `#171717`
- `Input/Placeholder` = `#9CA3AF`

**Dark Mode:**
- `Input/BG/Dark` = `#313131`
- `Input/Border/Dark` = `rgba(0, 0, 0, 0.05)`
- `Input/Text/Dark` = `#E5E5E5`
- `Input/Placeholder/Dark` = `#737373`

**Focus:**
- `Focus/Border` = `#3B82F6`
- `Focus/Ring` = `rgba(59, 130, 246, 0.2)`

---

## Border Radius Styles

- `Input/Radius` = `8px`
- `Focus/Ring/Radius` = `11px`
- `Focus/Highlight/Radius` = `7px`

---

## Notes

- Figma supports multiple shadows on a single element, so you can apply all 5 shadow layers to the input
- The focus ring and inner highlight should be separate layers/frames for easier animation
- Use Figma's component variants feature to switch between light/dark and default/focus states
- The inset shadows for the highlight effect should be applied to a separate layer positioned inside the input

