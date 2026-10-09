# Character portrait revisions - 9 October 2026

Four existing portraits were edited with the **built-in ChatGPT Images tool**, preserving the archive's painted style. Previous source PNGs and prompts remain intact; the selected revisions replace only the four characters' runtime WebPs and thumbnails. Exact input-image paths and prompts are recorded in `catalog.json` and the linked files below.

| Character | Revision direction | Selected source | Exact prompt |
| --- | --- | --- | --- |
| Gregor Eisenhorn | Slicked-back dark hair with a silver streak, stern gaunt older face, long charcoal greatcoat with a tall oxblood-lined collar and plain dark fastenings; no later-period cranial framework | [PNG](sources/gregor-eisenhorn.chatgpt-v4.png) | [Prompt](gregor-eisenhorn-chatgpt-v4.prompt.txt) |
| Tobias Maxilla | Later-novel blue velvet finery, pale powdered wig, fantail hat, jabot and green jewel beauty spot | [PNG](sources/tobias-maxilla.chatgpt-v2.png) | [Prompt](tobias-maxilla-chatgpt-v2.prompt.txt) |
| Uber Aemos | More ancient and fragile: hollow cheeks, bony neck, thin age-spotted skin, sparse white hair and narrow sloping shoulders; retain augmetic glasses | [PNG](sources/uber-aemos.chatgpt-v3.png) | [Prompt](uber-aemos-chatgpt-v3.prompt.txt) |
| Geard Bure | Hood lowered, readable face, functional optics and tool apron in a materials-science laboratory | [PNG](sources/geard-bure.chatgpt-v2.png) | [Prompt](geard-bure-chatgpt-v2.prompt.txt) |

## Additional Maxilla appearance research

- The [German Lexicanum appearance entry](https://wh40k-de.lexicanum.com/wiki/Tobius_Maxilla), citing *Xenos* chapter 7, reports a strongly built captain of indeterminate apparent age. That scene has purple outerwear, a black neckcloth, facial powder, a sapphire facial ornament, a spun-silver cap, heavy rings and mother-of-pearl-decorated teeth. This informed the previous portrait, but is not his only outfit.
- A later scene in *Xenos*, a greeting aboard the Essene, describes voluminous blue velvet outerwear, a jabot, silk doublet, gold-buckled footwear, a fan-tailed hat over a powdered wig, artificially white skin and an emerald facial jewel. The narration also characterises him as learned, witty and an engaging host. This is the selected outfit for the revision.
- The [English Lexicanum entry](https://wh40k.lexicanum.com/wiki/Tobias_Maxilla) corroborates his extravagant clothing and mechanical lower body, but contains citation warnings and is not sufficient evidence for detailed facial features by itself.

The sapphire/silver-cap and emerald/wig descriptions belong to different appearances, not necessarily contradictory accounts. The revised portrait uses the latter consistently rather than combining both. His lower-body bionics are outside this bust crop. Specific face shape, eyes, hat construction and tailoring remain artistic choices; no newly invented scar, beard or facial augmentation is presented as canon. Existing Likeness data continues to describe the earlier attested outfit; it is not rewritten to pretend the selected illustration is the only canonical appearance.

## Aemos and Bure evidence boundaries

Aemos retains his established ancient savant identity and distinctive augmetic eyewear; the edit emphasises physical frailty rather than changing him into a mechanical priest.

Bure is identified as an Adeptus Mechanicus magos and metallurgist in the existing project research, with no physical description established. His exposed face, technical apron, compact optics and laboratory are therefore expressly **role-based artistic interpretation**, not newly discovered canonical traits. The user's request overrides the earlier prompt's deliberate face-obscuring shadow.

## Runtime deliverables

Selected full images: `public/portraits/{gregor-eisenhorn,tobias-maxilla,uber-aemos,geard-bure}.webp` (800 x 1000).

Selected thumbnails: the corresponding `.thumb.webp` files (240 x 300). The existing manifest paths continue to serve these across the Pict Archive, dossiers, hover cards and medallions. No application-code change, commit or deployment is part of this revision.

## Validation

- `node scripts/check-portraits.mjs`: all 102 character records, 204 runtime WebPs and source/prompt provenance pass.
- `nix develop --command pnpm build`: TypeScript and production build pass.
- `git diff --check`: passes.
- [Browser QA script](qa-revisions-2026-10-09.json): all four gallery thumbnails decode at 240 x 300; each enlarged viewer opens with the correct 800 x 1000 image and no reported browser exceptions.
- Viewer screenshots: [Eisenhorn](app-revised-gregor-eisenhorn.jpg), [Maxilla](app-revised-tobias-maxilla.jpg), [Aemos](app-revised-uber-aemos.jpg), [Bure](app-revised-geard-bure.jpg).
