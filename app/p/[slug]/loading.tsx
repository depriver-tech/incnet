/** Phones on slow links see this while the Wi-Fi page loads. System fonts and inline styles only. */
export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f4f6f5', fontFamily: 'system-ui, sans-serif', color: '#5f6b6d' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, margin: '0 auto 14px', borderRadius: '50%', border: '4px solid #d8e6e3', borderTopColor: '#0f9d8f', animation: 'p-spin .9s linear infinite' }} />
        Loading Wi-Fi…
        <style>{'@keyframes p-spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    </div>
  );
}
