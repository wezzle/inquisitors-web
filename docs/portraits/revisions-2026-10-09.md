# Character portrait revisions - 9 October 2026

Four existing portraits were edited with the **built-in ChatGPT Images tool**, preserving the archive's painted style. Previous source PNGs and prompts remain intact; the selected revisions replace only the four characters' runtime WebPs and thumbnails. Exact input-image paths and prompts are recorded in `catalog.json` and the linked files below.

| Character | Revision direction | Selected source | Exact prompt |
| --- | --- | --- | --- |
| Gregor Eisenhorn | Earlier incarnation: swept-back dark hair with silver streaks, red-lined collar, green shoulder armour, blue chest strap and gold insignia; no later-period cranial framework | [PNG](sources/gregor-eisenhorn.chatgpt-v3.png) | [Prompt](gregor-eisenhorn-chatgpt-v3.prompt.txt) |
| Tobias Maxilla | Later-novel blue velvet finery, pale powdered wig, fantail hat, jabot and green jewel beauty spot | [PNG](sources/tobias-maxilla.chatgpt-v2.png) | [Prompt](tobias-maxilla-chatgpt-v2.prompt.txt) |
| Uber Aemos | More ancient and fragile: hollow cheeks, bony neck, thin age-spotted skin, sparse white hair and narrow sloping shoulders; retain augmetic glasses | [PNG](sources/uber-aemos.chatgpt-v3.png) | [Prompt](uber-aemos-chatgpt-v3.prompt.txt) |
| Geard Bure | Classic Mechanicus tech-priest: red hooded robes with a readable face, optic eye, jaw augmetic, servo-arms with smithing tools, Cog Mechanicus and smith's apron, in his Cinchare forge (an earlier v2 showed him as a lab metallurgist) | [PNG](sources/geard-bure.chatgpt-v3.png) | [Prompt](geard-bure-chatgpt-v3.prompt.txt) |

## Additional Maxilla appearance research

- The [German Lexicanum appearance entry](https://wh40k-de.lexicanum.com/wiki/Tobius_Maxilla), citing *Xenos* chapter 7, reports a strongly built captain of indeterminate apparent age. That scene has purple outerwear, a black neckcloth, facial powder, a sapphire facial ornament, a spun-silver cap, heavy rings and mother-of-pearl-decorated teeth. This informed the previous portrait, but is not his only outfit.
- A later scene in *Xenos*, a greeting aboard the Essene, describes voluminous blue velvet outerwear, a jabot, silk doublet, gold-buckled footwear, a fan-tailed hat over a powdered wig, artificially white skin and an emerald facial jewel. The narration also characterises him as learned, witty and an engaging host. This is the selected outfit for the revision.
- The [English Lexicanum entry](https://wh40k.lexicanum.com/wiki/Tobias_Maxilla) corroborates his extravagant clothing and mechanical lower body, but contains citation warnings and is not sufficient evidence for detailed facial features by itself.

The sapphire/silver-cap and emerald/wig descriptions belong to different appearances, not necessarily contradictory accounts. The revised portrait uses the latter consistently rather than combining both. His lower-body bionics are outside this bust crop. Specific face shape, eyes, hat construction and tailoring remain artistic choices; no newly invented scar, beard or facial augmentation is presented as canon. Existing Likeness data continues to describe the earlier attested outfit; it is not rewritten to pretend the selected illustration is the only canonical appearance.

## Aemos and Bure evidence boundaries

Aemos retains his established ancient savant identity and distinctive augmetic eyewear; the edit emphasises physical frailty rather than changing him into a mechanical priest.

Bure is identified as an Adeptus Mechanicus magos and metallurgist in the existing project research, with no physical description established. As a Magos he is a senior tech-priest, so the selected portrait gives him the classic Mechanicus look: hooded red robes, an optic eye, augmetics, servo-arms with smithing tools and a forge setting. These details, and his readable face, are expressly **role-based artistic interpretation**, not canonical traits.

## Astartes proportion corrections

A proportion audit of all 102 portraits found four Space Marines drawn close to human scale. Each was edited to read as a 2.2–2.5 m transhuman (head small against massive shoulders, thick neck low in the gorget), with identity, costume, background and style unchanged.

| Character | Correction | Selected source | Exact prompt |
| --- | --- | --- | --- |
| Senefuru of Tizca | Added the missing right pauldron, broader armoured torso, helm lower and smaller | [PNG](sources/senefuru-of-tizca.chatgpt-v2.png) | [Prompt](senefuru-of-tizca-chatgpt-v2.prompt.txt) |
| Sadoth Xarbia | Smaller head, wider pauldrons, deeper gorget | [PNG](sources/sadoth-xarbia.chatgpt-v2.png) | [Prompt](sadoth-xarbia-chatgpt-v2.prompt.txt) |
| Comus Nocturnus | Broader shoulders and trapezius, thicker neck, smaller head | [PNG](sources/comus-nocturnus.chatgpt-v2.png) | [Prompt](comus-nocturnus-chatgpt-v2.prompt.txt) |
| Teke | Shorter, thicker neck set lower in the collar; less backward tilt | [PNG](sources/teke.chatgpt-v2.png) | [Prompt](teke-chatgpt-v2.prompt.txt) |

## Runtime deliverables

Selected full images: `public/portraits/{gregor-eisenhorn,tobias-maxilla,uber-aemos,geard-bure}.webp` (800 x 1000).

Selected thumbnails: the corresponding `.thumb.webp` files (240 x 300). The existing manifest paths continue to serve these across the Pict Archive, dossiers, hover cards and medallions. No application-code change, commit or deployment is part of this revision.

## Validation

- `node scripts/check-portraits.mjs`: all 102 character records, 204 runtime WebPs and source/prompt provenance pass.
- `nix develop --command pnpm build`: TypeScript and production build pass.
- `git diff --check`: passes.
- [Browser QA script](qa-revisions-2026-10-09.json): all four gallery thumbnails decode at 240 x 300; each enlarged viewer opens with the correct 800 x 1000 image and no reported browser exceptions.
- Viewer screenshots: [Eisenhorn](app-revised-gregor-eisenhorn.jpg), [Maxilla](app-revised-tobias-maxilla.jpg), [Aemos](app-revised-uber-aemos.jpg), [Bure](app-revised-geard-bure.jpg).
