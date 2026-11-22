/**
 * Mohave (headings) and DM Sans (text). Loaded on the dashboard, landing and sign-in pages only:
 * the captive Wi-Fi page must not depend on Google, which phones cannot reach before they log in.
 */
export function Fonts() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" precedence="default" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Mohave:wght@500;600;700&display=swap" />
    </>
  );
}
