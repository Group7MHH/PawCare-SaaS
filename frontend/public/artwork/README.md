# PawCare – Cute illustrated artwork

The 16 approved illustrations are stored as individual WebP assets in this directory, rather than a low-resolution cropped sprite. Vite copies the directory to the production build; React loads each image by its exact filename and uses the existing local SVG only if a file fails to load.

| Category | Files | Native resolution |
|---|---|---|
| Services | `bath`, `groom`, `nails`, `ears`, `vet`, `spa`, `dental`, `walk`, `daycare`, `transport` | 480 × 310 |
| Banners | `banner-duo`, `banner-play`, `banner-family` | 720 × 214 |
| Empty/error states | `empty`, `not-found`, `error` | 300 × 165 |

All files use the `.webp` extension. Adding or replacing an illustration does not require any changes to the booking API, customer/staff/admin roles, SQL tables or dashboard data. The compact `stickers-atlas.webp` approach was retired because each approximately 200-pixel crop became blurred when stretched across a service card.

The artwork is decorative. CSS entrance/hover transitions respect `prefers-reduced-motion`. The existing Admin Dashboard Figma layout and multi-service booking workflow remain intact.
