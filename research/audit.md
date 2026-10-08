# Codex audit: Eisenhorn / Ravenor / Bequin character dataset

Scope: all 46 entries with importance >= 3, plus lower-importance entries that looked suspicious. I also ran a scripted check across all 102 entries for inverted master/servant and mentor/student pairs and for relationship types that are misused.

Overall the data holds up well. Most fates, statuses, factions, book lists and directional relationships agree with the sources. Below are the corrections I can back with evidence. Items marked **medium** are not in the JSON block.

Evidence key:
- `raw/...` and `raw_bequin/...` are paths under `/home/wesley/work/tmp/40k/research/`.
- Archived Lexicanum pages were fetched with `kuri-fetch` through `https://web.archive.org/web/2025/https://wh40k.lexicanum.com/wiki/<Page>`.

---

## High confidence

### 1. gregor-eisenhorn: `aliases`. The Glossia codenames are swapped.
- **Current:** `["Farchaval (cover identity)", "Thorn", "Talon (Glossia codename)"]`
- **Proposed:** `["Farchaval (cover identity)", "Thorn (Glossia codename)"]`
- **Evidence:**
  - Lexicanum, *Thorn Wishes Talon (Short Story)* (archived 2024-12-29): "Inside, Ravenor (aka "Talon") meets with "Thorn" - his old mentor Gregor Eisenhorn."
  - TV Tropes (Literature/Ravenor, found by web search) gives the same reading: "Thorn wishes Talon" means Thorn (Eisenhorn) asks to meet Talon (Ravenor) in person.
  - In the Eisenhorn novels his Glossia callsign is "Thorn" ("Thorn wishes aegis").
  - Talon is Ravenor's codename, not Eisenhorn's.

### 2. gideon-ravenor: `aliases`. The Glossia codenames are swapped.
- **Current:** `["Talon", "the Chair", "Thorn (Glossia codename)"]`
- **Proposed:** `["Talon (Glossia codename)", "the Chair"]`
- **Evidence:**
  - Same Lexicanum TWT page: Ravenor is "Talon" and Eisenhorn is "Thorn".
  - "the Chair" is Zael's nickname for Ravenor (`raw_ravenor/tvt_chars.txt` line 275: "He refers to Nayl as "the guy" and Ravenor as "the Chair"").

### 3. kara-swole: `books`. She does not appear in Malleus.
- **Current:** includes `"malleus"`
- **Proposed:** `["hereticus","ravenor","ravenor-returned","ravenor-rogue","thorn-wishes-talon","pariah","penitent"]`
- **Evidence:**
  - `raw_ravenor/tvt_chars.txt` line 204: "Kara was introduced as one of Eisenhorn's many operatives in *Hereticus*".
  - `raw/lex/Malleus_Novel.txt`: the Dramatis Personae ("Eisenhorn's Retinue") has no Kara Swole.
  - `raw/lexc/Gregor_Eisenhorn.txt`, Retinue section: Kara is listed only under "Glaw's Revenge" (Hereticus), not "The Hunt for Quixos" (Malleus).
- Her arcs text is already consistent with this; it only describes Hereticus-era events.

### 4. kara-swole: relationship `carl-thonius:bound`. Wrong type.
- **Current:** `{target: carl-thonius, type: bound, note: "cured by him, forced to keep his secret"}`
- **Proposed:** replace with `enemy`.
- **Why:**
  - `bound` is used everywhere else in the dataset for daemon-host binding. Kara is not daemon-bound to Thonius.
  - Thonius's own reverse edge is already `kara-swole:betrayer` ("cures then mind-wipes her").
  - In Ravenor Rogue she fights his mental block and attacks him. `raw_ravenor/src6.txt` (ladyrhian review): "she knows something is terribly wrong, leading her to attack him".
  - `raw_ravenor/src4.txt` (Jou Montfort, Ravenor Rogue part 2): "he attacks her mind".

### 5. esarhaddon: relationship `cherubael:bound`. Wrong type.
- **Current:** `{target: cherubael, type: bound, note: "abducted by it"}`
- **Proposed:** replace with `enemy` (note: "abducted by it for Quixos").
- **Why:**
  - Esarhaddon is a rogue psyker who was carried off by Cherubael, not a daemonhost or host body.
  - `raw/lex/Malleus_Novel.txt`: "Cherubael fries his [Lyko's] brain and disappears with Esarhaddon."
  - Cherubael's reverse edge is already `esarhaddon:enemy`.

---

## Medium confidence (not in the JSON)

### 6. arianhrod-esw-sweydyr: `psy`
- **Current:** `psyker`
- **Proposed:** `none`
- **Evidence:**
  - Lexicanum *Arianhrod Esw Sweydyr* (archived) describes her only as "a human swordswoman from the planet Carthae, a practitioner of the Ewl Wyra Scryri school of swordsmanship, and the bearer of the force sword Barbarisater". No psychic ability is mentioned.
  - `raw/lex/Malleus_Novel.txt` does not mention any either.
  - Her niece Angharad, from the same tradition and with her own sword Evisorex, is `psy: none` in the dataset.
- This rests on the sources not mentioning powers, so I kept it at medium.

### 7. thaddeus-saur: `fate`
- **Current:** "...He was then killed, apparently by Mordaunt at his own request."
- **Proposed:** "His conditioning by the King's agents made him lead the graels to Mam Mordaunt, and he was killed immediately afterwards."
- **Evidence:** `raw_bequin/fr_Penitent.txt`: "Il est tué juste après avoir révélé la position de Mordaunt aux Graels, victime de son propre conditionnement." That is: he is killed right after revealing Mordaunt's position to the graels, a victim of his own conditioning.
- No source I found supports "by Mordaunt at his own request".

### 8. beta-bequin: `aliases`, entry `"Penitent (Glossia codename)"`
- None of the raw material (`rg -i glossia raw_bequin`) supports this.
- Penitent is the title of the second book. I could not verify it as her codename.
- Recommend removing it unless it comes from a text you trust.

### 9. wystan-frauka: `fate`
- **Current:** "...he is handed over to the Inquisition's black ships for testing."
- **Evidence:** `raw_ravenor/src1.txt` (TV Tropes, Literature/Ravenor): "Zael, Frauka, and Iosob are taken away for psychic testing".
  - The Black Ship detail is attested only for Zael (`raw_ravenor/tvt_chars.txt` line 279).
- **Proposed:** "His blankness burned away by Zael, he is taken away by the Inquisition for testing."

### 10. slyte: `title`
- **Current:** "Greater daemon"
- **Proposed:** "Daemon prince"
- **Evidence:** Lexicanum *Gideon Ravenor* (`raw/lexc/Gideon_Ravenor.txt`): "possessed by the daemon prince Slyte"; also "warned in secret of the daemon prince's manifestation".
- This is a terminology choice, so medium.

### 11. gregor-eisenhorn: relationship `bastian-verveuk:betrayer`
- The note says "sacrificed him to bind Cherubael".
- `raw/lex/Hereticus_Novel.txt` says Eisenhorn binds the daemon "to the body of the dying Verveuk" after Verveuk's own blunder ("Damn Verveuk all to hell").
- Calling this a betrayal is a judgement call. `bound` or `enemy` would fit better, but the evidence does not clearly rule out the current type.

### 12. zygmunt-molotch: `fate` wording
- **Current:** "...Ravenor destroys his mind in a field on Gudrun."
- **What the sources say:**
  - Lexicanum (`raw/lexc/Gideon_Ravenor.txt`): "Molotch attempted to flee again, but was stopped and summarily executed".
  - `raw_ravenor/src3.txt`: "In the epilogue, Ravenor kills Molotch once and for all".
- The "destroys his mind in a field" detail is not in any source I fetched. Not necessarily wrong, but unverified.

---

## Checked and confirmed (no change needed)

- **Cherubael's final state.** Lexicanum *Cherubael*: "Eisenhorn dispatched Cherubael to recover Bequin but was stopped by Comus. The two engaged in a fierce battle." `status: other` is fine.
- **Eisenhorn.** Faked his death in Penitent:
  - TV Tropes Bequin, "Faking the Dead": "He takes advantage of the unanticipated attack on his hideout to fool Bequin into thinking he and Medea died".
  - `raw_bequin/fr_Penitent.txt`: "Eisenhorn, bien vivant, fait son retour" (Eisenhorn, alive and well, makes his return).
  - Origin DeKere's World and Ordo Xenos confirmed by `raw/lexc/Gregor_Eisenhorn.txt`.
- **Medea.** Alive; took part in the faked death (TV Tropes "Broken Pedestal"). She spent 20 years as Sister Bismillah watching over Beta (`fr_Pariah.txt`).
- **Nayl.** Alive. Lexicanum *Harlon Nayl* (archived): from Loki; left Ravenor after Rogue; "In 450.M41 he faked his death to reunite with Eisenhorn". He switches sides again in Penitent (`fr_Penitent.txt`).
- **Kara.**
  - Appears in Pariah, loyal to Ravenor and resentful of Eisenhorn (`fr_Pariah.txt`), so her `gregor-eisenhorn:enemy` edge is supported.
  - Appears in Penitent at the Timurlin séance (TV Tropes "Interrogating the Dead").
  - Origin Bonaventure confirmed by `raw/lexc/Kara_Swole.txt`.
- **Kys.**
  - From Sameter (`tvt_chars.txt`).
  - Posed as Mordaunt (`fr_Pariah.txt`).
  - Her trust is broken by Ravenor's Aeldari dealings (TV Tropes "Broken Pedestal").
  - Tried to kill Zael (`raw_ravenor/src30.txt`).
- **Alizebeth Bequin.**
  - Origin Bonaventure; alias "Lyse B" (`raw/lexc/Alizebeth_Bequin.txt`).
  - Fischig weapons training is correct.
  - Ravenor held her body (`raw_bequin/jm_pen3.txt`).
- **Fischig.**
  - Shot out Eisenhorn's knees, was killed by Medea, and his corpse became Cherubael's host (`raw/lexc/Godwyn_Fischig.txt`).
  - The trap at Jeganda is confirmed (`raw/lex/Hereticus_Novel.txt` ch. 18).
- **Osma.** Shot by Maxilla. Heldane survived and stayed silent about it (`raw/lexc/Leonid_Osma.txt`).
- **Voke.** Ordo Malleus, psyker, killed by Prophaniti. **Quixos.** Ordo Malleus, psyker. **Molitor.** Killed thanks to Bequin. **Locke.** Crushed by masonry on 56-Izar. **Mandragore.** Beheaded on KCX-1288. **Thuring.** Died with Cruor Vult. **Marla Tarray.** Daughter of Pontius. **Pontius.** Seventh son.
- **Thorn Wishes Talon cast** (Lexicanum): Ravenor, Kara, Kys, Thonius, Mathuin, Nayl, Eisenhorn, Cherubael. The `books` arrays match this.
- **End of Ravenor Rogue** (`raw_ravenor/src1.txt`, "Breaking the Fellowship"):
  - Zeph, Angharad and Carl dead.
  - Nayl and Belknap walk out.
  - Zael, Frauka and Iosob taken away for testing.
  - Unwerth and Preest break contact.
  - Kara awaits trial.
  - Maud and Patience remain.
  - The statuses and fates in the dataset match this.
- **Molotch.** Not a psyker; alias Oska Ludolf Barazan confirmed (`tvt_chars.txt`).
- **Direction check.** No inverted master/servant or mentor/student pairs anywhere in the dataset (scripted cross-check). Every relationship target id exists.

## Missing characters

I found no genuinely major character who is missing. The Pariah and Penitent casts are well covered, including the Immaterial College, Comus, Deathrow, Aulay and Dance. The absent names are all minor, for example Lucrea (Pariah), Dazzo (Xenos), and Mescher Qus or Jan Husmaan (Malleus).

---

## JSON (high-confidence only)

```json
{ "characters": {
  "gregor-eisenhorn": { "aliases": ["Farchaval (cover identity)", "Thorn (Glossia codename)"] },
  "gideon-ravenor": { "aliases": ["Talon (Glossia codename)", "the Chair"] },
  "kara-swole": {
    "books": ["hereticus", "ravenor", "ravenor-returned", "ravenor-rogue", "thorn-wishes-talon", "pariah", "penitent"],
    "removeRelationships": ["carl-thonius:bound"],
    "addRelationships": [{ "target": "carl-thonius", "type": "enemy", "note": "cured by him, then mind-blocked to keep his secret" }]
  },
  "esarhaddon": {
    "removeRelationships": ["cherubael:bound"],
    "addRelationships": [{ "target": "cherubael", "type": "enemy", "note": "abducted by it for Quixos" }]
  }
} }
```

Note: `research/curation.json` already has `gideon-ravenor.removeRelationships: ["gregor-eisenhorn:mentor"]`. Merge the `aliases` key above alongside it rather than overwriting it.
