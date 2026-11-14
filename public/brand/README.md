# Supplied Inversis artwork

Only these original Inversis assets may supply branding. Do not add, imitate or
modify NASA logos, flags, mission insignia or NASA-specific branding/design elements.
Factual dataset attribution remains appropriate. See `docs/BRANDING_AUDIT.md`.

The project owner supplied these originals for integration into Inversis on
2026-11-14. The files are preserved without pixel modification or regeneration.

| Original | Dimensions | SHA-256 |
|---|---|---|
| Inversis Teal-Green Gradient Logo.png → inversis-logo-original.png | 1448 × 1086 | 0397fa588d1bbc5581c83a9060a5b24a85d75685b25d0c77712daf77ff7ee410 |
| Inversis Gradient Landscape Banner.png → inversis-banner-original.png | 2172 × 724 | 23a870bba896cd542388d2104a6c36f7c0c5ab17eb61dc093d7823f913666826 |

`Brand.tsx` uses `inversis-logo-transparent.png` (1122 × 281), a deterministic
transparency derivative of the retained original. Header and certificate preserve
its aspect ratio. `inversis-favicon.png` (96 × 96) fits the same original symbol
proportionally on a transparent canvas. Neither asset is generated artwork.

Run `python scripts/prepare-brand.py` from the repository root to reproduce both
derivatives. Pillow is needed only for this optional asset-maintenance command;
it is not an application dependency. The script removes surrounding whitespace
and the near-white background, retains interior artwork pixels and white symbol
guides, and decontaminates anti-aliased edge pixels against the original background.
The original source files remain byte-identical. A three-background review image
is written to ignored `.local/logo-transparency-review.png`.

| Derivative | SHA-256 |
|---|---|
| inversis-logo-transparent.png | 3842de33ba2ba0d1bde5fce7ba7b2a932cd27a1ffaf5e6f30d3720930b256439 |
| inversis-favicon.png | 17870dc91d369994f5673035ead0fa7040120ee94b23efd5428932b16adb29f4 |

The Context composition crops a corner of the supplied banner through CSS; it is
not repeated behind charts or numerical results. No NASA logo, map tile, satellite
image, remote font or reinterpretation of the Inversis identity is introduced.

These are owner-supplied brand assets, not NASA evidence. No third-party endorsement
or additional ownership claim is asserted here.
