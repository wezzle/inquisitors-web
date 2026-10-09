# Complete ChatGPT Images portrait collection

All **102 characters** in the current codex have a selected painted portrait, generated or edited with the built-in ChatGPT Images tool. Beta Bequin supplies the common painted style.

## Runtime integration

Painted WebPs replace SVG portraits throughout the **Pict Archive**, **dossiers**, **hover cards** and **three.js medallions**. Click a dossier portrait to enlarge it; Escape closes the modal and leaves the dossier open. Original SVGs remain as a missing-asset fallback only. All current character IDs are covered.

- Selected full images: `public/portraits/<id>.webp` (800 x 1000).
- Selected thumbnails: `public/portraits/<id>.thumb.webp` (240 x 300).
- Runtime manifest: `src/data/portraits.json`.
- Source PNGs, including earlier trials: `docs/portraits/sources/` (not shipped in the public site).
- Source/prompt/allegiance records: [catalog.json](catalog.json).
- Original 91-character generation plan: [generation-plan.json](generation-plan.json).

## Background direction

| Allegiance | Environmental accents | Settings |
| --- | --- | --- |
| Inquisition | Old gold, amber | Investigation offices, command rooms, tribunal chambers |
| Retinue | Muted blue-cyan | Safehouses, armouries, research alcoves, cockpits, infiltration routes |
| Imperium | Slate and silver-blue | Precincts, naval stations, bastions, cloisters |
| Heretic | Oxblood, ember-red | Conspirators' studies, decaying estates, cult sanctuaries |
| Daemon | Black-violet | Containment vaults, Warp thresholds, spectral recesses |
| Xenos | Subdued jade-green | Nonhuman architecture and alien structures |
| Rogue | Rust-orange, smoky amber | Trading docks, private ships, underhive hideouts |
| Civilian | Linen, ochre, tobacco | Workshops, shops, dwellings, studios |

These scenes and unrecorded physical details are **artistic interpretations, not canonical evidence**. The app retains the independent researched appearance summaries and evidence. Unseen characters use anonymous or symbolic depictions. Slyte's selected revision depicts its distinct daemon manifestation; Bakunin's revision reflects the codex's elderly portraitist context. Earlier trials remain preserved.

## Selected assets and exact prompts

| Character | Allegiance | Full portrait | Source PNG | Exact selected prompt |
| --- | --- | --- | --- | --- |
| Ahenobarb | imperial | [WebP](../../public/portraits/ahenobarb.webp) | [PNG](sources/ahenobarb.chatgpt.png) | [Prompt](ahenobarb-chatgpt.prompt.txt) |
| Alace Quatorze | heretic | [WebP](../../public/portraits/alace-quatorze.webp) | [PNG](sources/alace-quatorze.chatgpt.png) | [Prompt](alace-quatorze-chatgpt.prompt.txt) |
| Alizebeth "Beta" Bequin | retinue | [WebP](../../public/portraits/beta-bequin.webp) | [PNG](sources/beta-bequin.chatgpt-background-v2.png) | [Prompt](beta-bequin-chatgpt-background-v2.prompt.txt) |
| Alizebeth Bequin | retinue | [WebP](../../public/portraits/alizebeth-bequin.webp) | [PNG](sources/alizebeth-bequin.chatgpt-background-v2.png) | [Prompt](alizebeth-bequin-chatgpt-background-v2.prompt.txt) |
| Angharad Esw Sweydyr | retinue | [WebP](../../public/portraits/angharad-esw-sweydyr.webp) | [PNG](sources/angharad-esw-sweydyr.chatgpt.png) | [Prompt](angharad-esw-sweydyr-chatgpt.prompt.txt) |
| Arianhrod Esw Sweydyr | retinue | [WebP](../../public/portraits/arianhrod-esw-sweydyr.webp) | [PNG](sources/arianhrod-esw-sweydyr.chatgpt.png) | [Prompt](arianhrod-esw-sweydyr-chatgpt.prompt.txt) |
| Arnault Tantalid | inquisition | [WebP](../../public/portraits/arnault-tantalid.webp) | [PNG](sources/arnault-tantalid.chatgpt.png) | [Prompt](arnault-tantalid-chatgpt.prompt.txt) |
| Bakunin | civilian | [WebP](../../public/portraits/bakunin.webp) | [PNG](sources/bakunin.chatgpt-v2.png) | [Prompt](bakunin-chatgpt-v2.prompt.txt) |
| Balthus Blackwards | heretic | [WebP](../../public/portraits/balthus-blackwards.webp) | [PNG](sources/balthus-blackwards.chatgpt.png) | [Prompt](balthus-blackwards-chatgpt.prompt.txt) |
| Bartol Siskind | heretic | [WebP](../../public/portraits/bartol-siskind.webp) | [PNG](sources/bartol-siskind.chatgpt.png) | [Prompt](bartol-siskind-chatgpt.prompt.txt) |
| Bastian Verveuk | inquisition | [WebP](../../public/portraits/bastian-verveuk.webp) | [PNG](sources/bastian-verveuk.chatgpt.png) | [Prompt](bastian-verveuk-chatgpt.prompt.txt) |
| Beldame Sadia | heretic | [WebP](../../public/portraits/beldame-sadia.webp) | [PNG](sources/beldame-sadia.chatgpt.png) | [Prompt](beldame-sadia-chatgpt.prompt.txt) |
| Brytnoth | imperial | [WebP](../../public/portraits/brytnoth.webp) | [PNG](sources/brytnoth.chatgpt.png) | [Prompt](brytnoth-chatgpt.prompt.txt) |
| Carl Thonius | retinue | [WebP](../../public/portraits/carl-thonius.webp) | [PNG](sources/carl-thonius.chatgpt-background-v2.png) | [Prompt](carl-thonius-chatgpt-background-v2.prompt.txt) |
| Cherubael | daemon | [WebP](../../public/portraits/cherubael.webp) | [PNG](sources/cherubael.chatgpt-background-v2.png) | [Prompt](cherubael-chatgpt-background-v2.prompt.txt) |
| Commodus Voke | inquisition | [WebP](../../public/portraits/commodus-voke.webp) | [PNG](sources/commodus-voke.chatgpt.png) | [Prompt](commodus-voke-chatgpt.prompt.txt) |
| Comus Nocturnus | rogue | [WebP](../../public/portraits/comus-nocturnus.webp) | [PNG](sources/comus-nocturnus.chatgpt.png) | [Prompt](comus-nocturnus-chatgpt.prompt.txt) |
| Connort Timurlin | heretic | [WebP](../../public/portraits/connort-timurlin.webp) | [PNG](sources/connort-timurlin.chatgpt.png) | [Prompt](connort-timurlin-chatgpt.prompt.txt) |
| Constant Shadrake | civilian | [WebP](../../public/portraits/constant-shadrake.webp) | [PNG](sources/constant-shadrake.chatgpt.png) | [Prompt](constant-shadrake-chatgpt.prompt.txt) |
| Crezia Berschilde | civilian | [WebP](../../public/portraits/crezia-berschilde.webp) | [PNG](sources/crezia-berschilde.chatgpt.png) | [Prompt](crezia-berschilde-chatgpt.prompt.txt) |
| Crookley | civilian | [WebP](../../public/portraits/crookley.webp) | [PNG](sources/crookley.chatgpt.png) | [Prompt](crookley-chatgpt.prompt.txt) |
| Cynia Preest | rogue | [WebP](../../public/portraits/cynia-preest.webp) | [PNG](sources/cynia-preest.chatgpt.png) | [Prompt](cynia-preest-chatgpt.prompt.txt) |
| Darra Voriet | inquisition | [WebP](../../public/portraits/darra-voriet.webp) | [PNG](sources/darra-voriet.chatgpt.png) | [Prompt](darra-voriet-chatgpt.prompt.txt) |
| Deathrow | rogue | [WebP](../../public/portraits/deathrow.webp) | [PNG](sources/deathrow.chatgpt.png) | [Prompt](deathrow-chatgpt.prompt.txt) |
| Duboe | rogue | [WebP](../../public/portraits/duboe.webp) | [PNG](sources/duboe.chatgpt.png) | [Prompt](duboe-chatgpt.prompt.txt) |
| Ebon Nastrand | heretic | [WebP](../../public/portraits/ebon-nastrand.webp) | [PNG](sources/ebon-nastrand.chatgpt.png) | [Prompt](ebon-nastrand-chatgpt.prompt.txt) |
| Eleena Koi | retinue | [WebP](../../public/portraits/eleena-koi.webp) | [PNG](sources/eleena-koi.chatgpt.png) | [Prompt](eleena-koi-chatgpt.prompt.txt) |
| Esarhaddon | heretic | [WebP](../../public/portraits/esarhaddon.webp) | [PNG](sources/esarhaddon.chatgpt.png) | [Prompt](esarhaddon-chatgpt.prompt.txt) |
| Eskeen Hansaard | imperial | [WebP](../../public/portraits/eskeen-hansaard.webp) | [PNG](sources/eskeen-hansaard.chatgpt.png) | [Prompt](eskeen-hansaard-chatgpt.prompt.txt) |
| Estrum | heretic | [WebP](../../public/portraits/captain-estrum.webp) | [PNG](sources/captain-estrum.chatgpt.png) | [Prompt](captain-estrum-chatgpt.prompt.txt) |
| Faria | heretic | [WebP](../../public/portraits/faria.webp) | [PNG](sources/faria.chatgpt.png) | [Prompt](faria-chatgpt.prompt.txt) |
| Fayde Thuring | heretic | [WebP](../../public/portraits/fayde-thuring.webp) | [PNG](sources/fayde-thuring.chatgpt.png) | [Prompt](fayde-thuring-chatgpt.prompt.txt) |
| Feaver Skoh | rogue | [WebP](../../public/portraits/feaver-skoh.webp) | [PNG](sources/feaver-skoh.chatgpt.png) | [Prompt](feaver-skoh-chatgpt.prompt.txt) |
| Freddy Dance | civilian | [WebP](../../public/portraits/freddy-dance.webp) | [PNG](sources/freddy-dance.chatgpt.png) | [Prompt](freddy-dance-chatgpt.prompt.txt) |
| Gall Ballack | heretic | [WebP](../../public/portraits/gall-ballack.webp) | [PNG](sources/gall-ballack.chatgpt.png) | [Prompt](gall-ballack-chatgpt.prompt.txt) |
| Geard Bure | imperial | [WebP](../../public/portraits/geard-bure.webp) | [PNG](sources/geard-bure.chatgpt-v2.png) | [Prompt](geard-bure-chatgpt-v2.prompt.txt) |
| Gideon Ravenor | inquisition | [WebP](../../public/portraits/gideon-ravenor.webp) | [PNG](sources/gideon-ravenor.chatgpt-background-v2.png) | [Prompt](gideon-ravenor-chatgpt-background-v2.prompt.txt) |
| Girolamo Malahite | heretic | [WebP](../../public/portraits/girolamo-malahite.webp) | [PNG](sources/girolamo-malahite.chatgpt.png) | [Prompt](girolamo-malahite-chatgpt.prompt.txt) |
| Godwyn Fischig | retinue | [WebP](../../public/portraits/godwyn-fischig.webp) | [PNG](sources/godwyn-fischig.chatgpt.png) | [Prompt](godwyn-fischig-chatgpt.prompt.txt) |
| Golesh Heldane | inquisition | [WebP](../../public/portraits/golesh-heldane.webp) | [PNG](sources/golesh-heldane.chatgpt.png) | [Prompt](golesh-heldane-chatgpt.prompt.txt) |
| Gorgone Locke | heretic | [WebP](../../public/portraits/gorgone-locke.webp) | [PNG](sources/gorgone-locke.chatgpt.png) | [Prompt](gorgone-locke-chatgpt.prompt.txt) |
| Gregor Eisenhorn | inquisition | [WebP](../../public/portraits/gregor-eisenhorn.webp) | [PNG](sources/gregor-eisenhorn.chatgpt-v4.png) | [Prompt](gregor-eisenhorn-chatgpt-v4.prompt.txt) |
| Harlon Nayl | retinue | [WebP](../../public/portraits/harlon-nayl.webp) | [PNG](sources/harlon-nayl.chatgpt-background-v2.png) | [Prompt](harlon-nayl-chatgpt-background-v2.prompt.txt) |
| Inquisitor Fenx | inquisition | [WebP](../../public/portraits/inquisitor-fenx.webp) | [PNG](sources/inquisitor-fenx.chatgpt.png) | [Prompt](inquisitor-fenx-chatgpt.prompt.txt) |
| Iosob | civilian | [WebP](../../public/portraits/iosob.webp) | [PNG](sources/iosob.chatgpt.png) | [Prompt](iosob-chatgpt.prompt.txt) |
| Jader Trice | heretic | [WebP](../../public/portraits/jader-trice.webp) | [PNG](sources/jader-trice.chatgpt.png) | [Prompt](jader-trice-chatgpt.prompt.txt) |
| Javes Thysser | inquisition | [WebP](../../public/portraits/javes-thysser.webp) | [PNG](sources/javes-thysser.chatgpt.png) | [Prompt](javes-thysser-chatgpt.prompt.txt) |
| Judika Sowl | heretic | [WebP](../../public/portraits/judika-sowl.webp) | [PNG](sources/judika-sowl.chatgpt.png) | [Prompt](judika-sowl-chatgpt.prompt.txt) |
| Kara Swole | retinue | [WebP](../../public/portraits/kara-swole.webp) | [PNG](sources/kara-swole.chatgpt-background-v2.png) | [Prompt](kara-swole-chatgpt-background-v2.prompt.txt) |
| Kizary Thekla | rogue | [WebP](../../public/portraits/kizary-thekla.webp) | [PNG](sources/kizary-thekla.chatgpt.png) | [Prompt](kizary-thekla-chatgpt.prompt.txt) |
| Konrad Molitor | inquisition | [WebP](../../public/portraits/konrad-molitor.webp) | [PNG](sources/konrad-molitor.chatgpt.png) | [Prompt](konrad-molitor-chatgpt.prompt.txt) |
| Leonid Osma | inquisition | [WebP](../../public/portraits/leonid-osma.webp) | [PNG](sources/leonid-osma.chatgpt.png) | [Prompt](leonid-osma-chatgpt.prompt.txt) |
| Leyla Slade | heretic | [WebP](../../public/portraits/leyla-slade.webp) | [PNG](sources/leyla-slade.chatgpt.png) | [Prompt](leyla-slade-chatgpt.prompt.txt) |
| Lilean Chase | heretic | [WebP](../../public/portraits/lilean-chase.webp) | [PNG](sources/lilean-chase.chatgpt.png) | [Prompt](lilean-chase-chatgpt.prompt.txt) |
| Lomer Kinsky | imperial | [WebP](../../public/portraits/lomer-kinsky.webp) | [PNG](sources/lomer-kinsky.chatgpt.png) | [Prompt](lomer-kinsky-chatgpt.prompt.txt) |
| Lores Vibben | retinue | [WebP](../../public/portraits/lores-vibben.webp) | [PNG](sources/lores-vibben.chatgpt.png) | [Prompt](lores-vibben-chatgpt.prompt.txt) |
| Lowink | retinue | [WebP](../../public/portraits/lowink.webp) | [PNG](sources/lowink.chatgpt.png) | [Prompt](lowink-chatgpt.prompt.txt) |
| Lucius Worna | rogue | [WebP](../../public/portraits/lucius-worna.webp) | [PNG](sources/lucius-worna.chatgpt.png) | [Prompt](lucius-worna-chatgpt.prompt.txt) |
| Lupan | civilian | [WebP](../../public/portraits/lupan.webp) | [PNG](sources/lupan.chatgpt.png) | [Prompt](lupan-chatgpt.prompt.txt) |
| Lyko | inquisition | [WebP](../../public/portraits/lyko.webp) | [PNG](sources/lyko.chatgpt.png) | [Prompt](lyko-chatgpt.prompt.txt) |
| Madsen | imperial | [WebP](../../public/portraits/madsen.webp) | [PNG](sources/madsen.chatgpt.png) | [Prompt](madsen-chatgpt.prompt.txt) |
| Mam Mordaunt | heretic | [WebP](../../public/portraits/mam-mordaunt.webp) | [PNG](sources/mam-mordaunt.chatgpt.png) | [Prompt](mam-mordaunt-chatgpt.prompt.txt) |
| Mandragore Carrion | heretic | [WebP](../../public/portraits/mandragore-carrion.webp) | [PNG](sources/mandragore-carrion.chatgpt.png) | [Prompt](mandragore-carrion-chatgpt.prompt.txt) |
| Marla Tarray | heretic | [WebP](../../public/portraits/marla-tarray.webp) | [PNG](sources/marla-tarray.chatgpt.png) | [Prompt](marla-tarray-chatgpt.prompt.txt) |
| Massimo Ricci | inquisition | [WebP](../../public/portraits/massimo-ricci.webp) | [PNG](sources/massimo-ricci.chatgpt.png) | [Prompt](massimo-ricci-chatgpt.prompt.txt) |
| Maud Plyton | retinue | [WebP](../../public/portraits/maud-plyton.webp) | [PNG](sources/maud-plyton.chatgpt.png) | [Prompt](maud-plyton-chatgpt.prompt.txt) |
| Medea Betancore | retinue | [WebP](../../public/portraits/medea-betancore.webp) | [PNG](sources/medea-betancore.chatgpt-background-v2.png) | [Prompt](medea-betancore-chatgpt-background-v2.prompt.txt) |
| Midas Betancore | retinue | [WebP](../../public/portraits/midas-betancore.webp) | [PNG](sources/midas-betancore.chatgpt.png) | [Prompt](midas-betancore-chatgpt.prompt.txt) |
| Murdin Eyclone | heretic | [WebP](../../public/portraits/murdin-eyclone.webp) | [PNG](sources/murdin-eyclone.chatgpt.png) | [Prompt](murdin-eyclone-chatgpt.prompt.txt) |
| Nathun Inshabel | inquisition | [WebP](../../public/portraits/nathun-inshabel.webp) | [PNG](sources/nathun-inshabel.chatgpt.png) | [Prompt](nathun-inshabel-chatgpt.prompt.txt) |
| Neve | inquisition | [WebP](../../public/portraits/neve.webp) | [PNG](sources/neve.chatgpt.png) | [Prompt](neve-chatgpt.prompt.txt) |
| Oberon Glaw | heretic | [WebP](../../public/portraits/oberon-glaw.webp) | [PNG](sources/oberon-glaw.chatgpt.png) | [Prompt](oberon-glaw-chatgpt.prompt.txt) |
| Orfeo Culzean | heretic | [WebP](../../public/portraits/orfeo-culzean.webp) | [PNG](sources/orfeo-culzean.chatgpt.png) | [Prompt](orfeo-culzean-chatgpt.prompt.txt) |
| Patience Kys | retinue | [WebP](../../public/portraits/patience-kys.webp) | [PNG](sources/patience-kys.chatgpt-background-v2.png) | [Prompt](patience-kys-chatgpt-background-v2.prompt.txt) |
| Patrik Belknap | retinue | [WebP](../../public/portraits/patrik-belknap.webp) | [PNG](sources/patrik-belknap.chatgpt.png) | [Prompt](patrik-belknap-chatgpt.prompt.txt) |
| Phlebas Alessandro Rorken | inquisition | [WebP](../../public/portraits/phlebas-alessandro-rorken.webp) | [PNG](sources/phlebas-alessandro-rorken.chatgpt.png) | [Prompt](phlebas-alessandro-rorken-chatgpt.prompt.txt) |
| Pontifex Urba | imperial | [WebP](../../public/portraits/pontifex-urba.webp) | [PNG](sources/pontifex-urba.chatgpt.png) | [Prompt](pontifex-urba-chatgpt.prompt.txt) |
| Pontius Glaw | heretic | [WebP](../../public/portraits/pontius-glaw.webp) | [PNG](sources/pontius-glaw.chatgpt.png) | [Prompt](pontius-glaw-chatgpt.prompt.txt) |
| Prophaniti | daemon | [WebP](../../public/portraits/prophaniti.webp) | [PNG](sources/prophaniti.chatgpt.png) | [Prompt](prophaniti-chatgpt.prompt.txt) |
| Quixos | heretic | [WebP](../../public/portraits/quixos.webp) | [PNG](sources/quixos.chatgpt.png) | [Prompt](quixos-chatgpt.prompt.txt) |
| Raum Grumman | inquisition | [WebP](../../public/portraits/raum-grumman.webp) | [PNG](sources/raum-grumman.chatgpt.png) | [Prompt](raum-grumman-chatgpt.prompt.txt) |
| Renner Lightburn | civilian | [WebP](../../public/portraits/renner-lightburn.webp) | [PNG](sources/renner-lightburn.chatgpt.png) | [Prompt](renner-lightburn-chatgpt.prompt.txt) |
| Sadoth Xarbia | heretic | [WebP](../../public/portraits/sadoth-xarbia.webp) | [PNG](sources/sadoth-xarbia.chatgpt.png) | [Prompt](sadoth-xarbia-chatgpt.prompt.txt) |
| Scarpac | heretic | [WebP](../../public/portraits/scarpac.webp) | [PNG](sources/scarpac.chatgpt.png) | [Prompt](scarpac-chatgpt.prompt.txt) |
| Senefuru of Tizca | heretic | [WebP](../../public/portraits/senefuru-of-tizca.webp) | [PNG](sources/senefuru-of-tizca.chatgpt.png) | [Prompt](senefuru-of-tizca-chatgpt.prompt.txt) |
| Sholto Unwerth | rogue | [WebP](../../public/portraits/sholto-unwerth.webp) | [PNG](sources/sholto-unwerth.chatgpt.png) | [Prompt](sholto-unwerth-chatgpt.prompt.txt) |
| Slyte | daemon | [WebP](../../public/portraits/slyte.webp) | [PNG](sources/slyte.chatgpt-v2.png) | [Prompt](slyte-chatgpt-v2.prompt.txt) |
| Teke | heretic | [WebP](../../public/portraits/teke.webp) | [PNG](sources/teke.chatgpt.png) | [Prompt](teke-chatgpt.prompt.txt) |
| Thaddeus Saur | heretic | [WebP](../../public/portraits/thaddeus-saur.webp) | [PNG](sources/thaddeus-saur.chatgpt.png) | [Prompt](thaddeus-saur-chatgpt.prompt.txt) |
| The Brass Thief | daemon | [WebP](../../public/portraits/brass-thief.webp) | [PNG](sources/brass-thief.chatgpt.png) | [Prompt](brass-thief-chatgpt.prompt.txt) |
| The King in Yellow | heretic | [WebP](../../public/portraits/king-in-yellow.webp) | [PNG](sources/king-in-yellow.chatgpt.png) | [Prompt](king-in-yellow-chatgpt.prompt.txt) |
| The Saruthi | xenos | [WebP](../../public/portraits/the-saruthi.webp) | [PNG](sources/the-saruthi.chatgpt.png) | [Prompt](the-saruthi-chatgpt.prompt.txt) |
| Titus Endor | inquisition | [WebP](../../public/portraits/titus-endor.webp) | [PNG](sources/titus-endor.chatgpt.png) | [Prompt](titus-endor-chatgpt.prompt.txt) |
| Tobias Maxilla | retinue | [WebP](../../public/portraits/tobias-maxilla.webp) | [PNG](sources/tobias-maxilla.chatgpt-v2.png) | [Prompt](tobias-maxilla-chatgpt-v2.prompt.txt) |
| Toros Revoke | heretic | [WebP](../../public/portraits/toros-revoke.webp) | [PNG](sources/toros-revoke.chatgpt.png) | [Prompt](toros-revoke-chatgpt.prompt.txt) |
| Uber Aemos | retinue | [WebP](../../public/portraits/uber-aemos.webp) | [PNG](sources/uber-aemos.chatgpt-v3.png) | [Prompt](uber-aemos-chatgpt-v3.prompt.txt) |
| Urisel Glaw | heretic | [WebP](../../public/portraits/urisel-glaw.webp) | [PNG](sources/urisel-glaw.chatgpt.png) | [Prompt](urisel-glaw-chatgpt.prompt.txt) |
| Waltur Aulay | inquisition | [WebP](../../public/portraits/waltur-aulay.webp) | [PNG](sources/waltur-aulay.chatgpt.png) | [Prompt](waltur-aulay-chatgpt.prompt.txt) |
| Wystan Frauka | retinue | [WebP](../../public/portraits/wystan-frauka.webp) | [PNG](sources/wystan-frauka.chatgpt.png) | [Prompt](wystan-frauka-chatgpt.prompt.txt) |
| Zael Effernetti | retinue | [WebP](../../public/portraits/zael.webp) | [PNG](sources/zael.chatgpt.png) | [Prompt](zael-chatgpt.prompt.txt) |
| Zeph Mathuin | retinue | [WebP](../../public/portraits/zeph-mathuin.webp) | [PNG](sources/zeph-mathuin.chatgpt.png) | [Prompt](zeph-mathuin-chatgpt.prompt.txt) |
| Zygmunt Molotch | heretic | [WebP](../../public/portraits/zygmunt-molotch.webp) | [PNG](sources/zygmunt-molotch.chatgpt.png) | [Prompt](zygmunt-molotch-chatgpt.prompt.txt) |

For the first ten portraits, the selected prompt is a background-only edit; `catalog.json` also records the unchanged previous source. Eisenhorn, Aemos, Maxilla and Geard Bure were later reworked; see the [revision notes](revisions-2026-10-09.md). The first generation prompts remain beside the edit prompts. Every requested deliverable is retained locally.

## Validation and publishing

```sh
nix shell nixpkgs#nodejs_22 nixpkgs#imagemagick --command node scripts/publish-portraits.mjs
nix develop --command node scripts/check-portraits.mjs
nix develop --command pnpm build
```

No commit or deployment is performed by this image-generation work.

