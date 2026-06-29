// Paste di browser console untuk lihat session
fetch("/api/auth/session")
  .then((r) => r.json())
  .then(console.log)
