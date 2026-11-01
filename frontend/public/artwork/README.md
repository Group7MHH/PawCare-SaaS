# PawCare illustration pack

This frontend expects the approved cute illustration WebP assets in `frontend/public/artwork/`. They are deliberately separated from JSX, database records and server logic. If an image has not been uploaded yet, the `CuteIllustration` component shows the previous local SVG as a safe fallback.

To install the approved artwork **without VS Code**, download `PawCare_Cute_Illustrations.zip` from the ChatGPT conversation, extract it, then in GitHub open `frontend/public/artwork` on the current branch and choose **Add file → Upload files**. Upload the 16 `.webp` files from the archive's `artwork` folder and commit. Verify Render has deployed that commit and refresh the browser.

Service mapping: bath, groom, nails, ears, vet, spa, dental, walk, daycare; additional files: transport, banner-duo, banner-play, banner-family, empty, not-found and error. These files are decorative and not related to appointment, revenue or staff data.

Animations use CSS transforms and opacity, including `prefers-reduced-motion` support; their absence never changes a click action, API payload or dashboard figure.
