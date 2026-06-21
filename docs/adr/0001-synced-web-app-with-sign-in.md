# Synced web app with sign-in, not a local-only tool

This is a single-user tool for memorizing Scripts by progressively blacking out words, used on both an iPhone and a laptop. We chose to build it as one responsive web app (a PWA you "Add to Home Screen" on iPhone) backed by a small hosted backend with a simple email sign-in, so that Scripts, Read counts, and High scores stay identical across both devices.

We rejected a simpler local-only build (no backend, no login, data per-device) because the product's whole value is tracking Reads and High scores over time — and those stats would be split and meaningless if each device kept its own copy. The trade is more moving parts (a backend + auth) and a one-time sign-in, accepted to keep one unified history.
