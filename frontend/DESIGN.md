# Design System Document

## 1. Overview & Creative North Star: "The Ethereal Boutique"
This design system rejects the "boxed-in" nature of traditional web layouts. Instead of a rigid grid of outlines and dividers, we embrace **The Ethereal Boutique**—a creative North Star that treats the 1200px viewport as a curated editorial canvas.

The aesthetic is defined by "Soft Minimalism." We achieve structure through **tonal layering** and **asymmetric breathing room** rather than borders. By utilizing the interaction between vibrant purples (#652fe7) and deep, desaturated lilacs, the UI feels like a series of high-end physical surfaces floating in a soft, ambient space. The goal is to move beyond "functional" into "intentional," where every element feels placed by a designer's hand, not a layout engine.

---

## 2. Color & Surface Philosophy
Color is our primary structural tool. We use a "Light Theme" that leans into the warmth of the `surface` (#fcf4ff) to avoid the sterile coldness of pure white.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined solely through background color shifts.
* *Example:* A `surface-container-low` (#f8edff) section sitting on a `surface` background provides all the separation needed.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper.
1. **Base Layer:** `surface` (#fcf4ff).
2. **Sectioning:** `surface-container` (#f2e2ff).
3. **Interactive Elements/Cards:** `surface-container-lowest` (#ffffff) to create a "lifted" feel.

### The "Glass & Gradient" Rule
To add soul to the "Compact" layout, use Glassmorphism for floating headers or navigation bars. Use `surface` at 80% opacity with a `20px` backdrop-blur.
* **Signature Texture:** Use a subtle linear gradient for Primary CTAs: `primary` (#652fe7) to `primary_dim` (#5819db) at a 135-degree angle. This adds a "jewel-like" depth that flat hex codes lack.

---

## 3. Typography: Editorial Authority
We pair the geometric precision of **Manrope** for high-level expression with the utilitarian clarity of **Inter** for commerce-heavy data.

* **Display & Headlines (Manrope):** Large scales (`display-lg` at 3.5rem) should use `on_surface` (#37274d). The tight tracking and bold weight convey a "magazine" feel.
* **Titles & Body (Inter):** Reserved for functional information. Use `on_surface_variant` (#66547d) for body text to reduce optical vibration and improve long-form readability.
* **Labeling:** `label-md` should always be in Uppercase with +0.05em letter spacing to denote metadata or categories.

---

## 4. Elevation & Depth
Depth in this system is a result of light and shadow, not lines.

* **The Layering Principle:** Avoid shadows on static elements. Instead, place a `surface-container-lowest` card on a `surface-container-low` background. The slight shift in brightness creates a natural, soft lift.
* **Ambient Shadows:** For floating elements (Modals/Popovers), use a "Purple Dusk" shadow:
* `box-shadow: 0 20px 40px rgba(101, 47, 231, 0.06);`
* This shadow is tinted with the primary brand color to mimic natural ambient light.
* **The "Ghost Border" Fallback:** If a container is placed on a background of the same color, use a 1px border with `outline_variant` at 15% opacity. Never use 100% opacity.

---

## 5. Component Specifications

### Buttons: The Tactile Interaction
* **Primary:** Gradient fill (`primary` to `primary_dim`), `xl` (3rem) corner radius. Hover state: Scale 1.02 + increase shadow spread.
* **Secondary:** `surface-container-high` (#eedcff) background with `primary` text. No border.
* **Tertiary:** Ghost style. No background, `primary` text. Underline only on hover.

### Form Inputs: Soft Precision
* **The Container:** Use `surface-container-highest` (#e9d5ff) with a `DEFAULT` (1rem) corner radius.
* **Focus State:** Transition the background to `surface-container-lowest` (#ffffff) and add a 2px "Ghost Border" using `primary_container`.
* **Error:** Shift background to `error_container` (#f74b6d) at 10% opacity, text to `error`.

### Cards & Lists: The Open Layout
* **Cards:** Forbid divider lines. Use `spacing-8` (1.75rem) to separate internal content blocks.
* **Roundedness:** Use `lg` (2rem) for main product cards and `md` (1.5rem) for internal nested elements.
* **Images:** All images within cards must inherit a `md` (1.5rem) corner radius to match the system’s "rounded" DNA.

### Additional Signature Component: The "Curator Chip"
* For ShopShare's sharing features, use a "Glass Chip": A semi-transparent `primary_fixed_dim` background with a heavy backdrop-blur and `full` (9999px) rounding.

---

## 6. Do’s and Don'ts

### Do:
* **Embrace Asymmetry:** In the 1200px max-width container, allow some elements to bleed to the edges while others maintain generous `spacing-16` margins.
* **Use Tonal Shifts:** Use the `tertiary` (#9c3660) sparingly for "Sale" or "New" indicators to provide a high-end contrast to the purple mono-culture.
* **Prioritize Breathing Room:** When in doubt, increase the spacing. High-end design thrives on "wasteful" white space.

### Don’t:
* **Don't use pure black (#000000):** Use `on_surface` (#37274d) for all "black" text to keep the palette harmonious.
* **Don't use 90-degree corners:** Every interactive element must have at least a `sm` (0.5rem) radius.
* **Don't use "Drop Shadows":** Only use "Ambient Shadows" as defined in Section 4. If it looks like a "Photoshop drop shadow," it's too heavy.

---

## 7. Dark Theme (Ethereal Boutique — noite)

O tema escuro **não introduz preto puro**; mantém a mesma hierarquia semântica da Secção 2, com superfícies em violeta muito profundo e texto em lavanda clara. O **`primary`** ganha um tom ligeiramente mais luminoso no escuro para contraste acessível, preservando o gradiente joia (135°) entre `primary` e `primary_dim`.

| Token (CSS) | Claro | Escuro |
|-------------|-------|--------|
| `surface` / `background` | `#fcf4ff` | `#120e18` |
| `on_surface` | `#37274d` | `#ebe3f7` |
| `on_surface_variant` | `#66547d` | `#a89bb8` |
| `primary` | `#652fe7` | `#8b6cff` |
| `primary_dim` | `#5819db` | `#6b46f0` |
| `surface_container` | `#f2e2ff` | `#1a1524` |
| `surface_container_low` | `#f8edff` | `#201a2c` |
| `surface_container_high` | `#eedcff` | `#2d2640` |
| `surface_container_highest` | `#e9d5ff` | `#3a3150` |
| `surface_container_lowest` | `#ffffff` | `#2a2338` |
| `outline_variant` | `#baa4d3` | `#5c4f6e` |
| Glass nav | `surface` @ 80% + blur 20px | Mesma regra, base escura @ ~82% opacidade |

**Persistência:** a escolha do utilizador é guardada em `localStorage` (`shopshare-theme`) e aplicada em `<html data-theme="dark">` para que todas as rotas herdem os tokens.