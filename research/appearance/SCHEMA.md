# Appearance record schema

One JSON object per character, collected in `{ "appearance": [ ... ] }`. Every value must be supported by a source. If a source doesn't say, use `"unknown"` (or `[]` for lists). Never guess from fan art, video games or miniatures. Only the novels and short stories count, as reported by wikis, reviews or quotations.

```jsonc
{
  "id": "gregor-eisenhorn",            // the codex id, exactly as given
  "form": "human",                     // human | astartes | daemonhost | daemon | xenos | construct | chair
                                       //   chair = body hidden inside a force chair (Ravenor)
                                       //   daemonhost = possessed human host (Cherubael, Prophaniti)
                                       //   construct = mechanical/clockwork body (Pontius Glaw's later body, Brass Thief)
  "sex": "male",                       // male | female | unknown
  "age": "older",                      // child | young | adult | older | old | ancient | unknown
                                       //   use the apparent age as depicted (juvenat treatments count as looking younger)
  "build": "athletic",                 // slight | average | athletic | heavy | massive | unknown
  "skin": "unknown",                   // pale | fair | olive | tan | brown | dark | grey | unknown
  "hair": { "color": "dark-brown",     // black | dark-brown | brown | auburn | red | blonde | grey | white | silver | none | unknown
            "style": "short" },        // bald | shaven | cropped | short | medium | long | braided | topknot | tied | unknown
  "facialHair": "none",                // none | stubble | moustache | beard | long-beard | unknown
  "eyes": { "color": "unknown",        // any simple colour word (grey, blue, green, brown, black, red, gold, violet, white) or unknown
            "glow": false },           // true only if eyes are described as glowing / burning (daemonhosts, some psykers)
  "marks": [],                         // zero or more of:
      // scar-face, burn-scars, augmetic-eye, augmetic-eyes, augmetic-jaw, augmetic-arm, augmetic-cranial,
      // data-cables, tattoos-face, tattoos-body, freckles, wrinkles, paralysed-face, pale-sickly,
      // blindfold, mask, veil, beauty-mark, wards (warding runes/sigils on skin), chains (bound in chains)
  "attire": [],                        // zero or more of:
      // long-coat, high-collar, robes, hood, cloak, armour-light, armour-heavy, power-armour, uniform,
      // finery, rags, bodyglove, priest-vestments, fur, rosette, tricorn, cap, circlet, helmet
  "carries": [],                       // zero or more of: sword, pistol, staff, book, lho-stick, rifle, daggers, blades-floating, hammer
  "palette": [],                       // 0–3 CSS hex colours ONLY if their clothing/armour colours are described (e.g. legion colours)
  "described": "partial",              // well | partial | none  — how much physical description the books give
  "summary": "One or two sentences paraphrasing how they look (no long quotes).",
  "evidence": [ { "claim": "short claim", "source": "URL or research/raw… path" } ]
}
```

Notes:
- For Astartes, use `form: astartes` and give legion colours in `palette` (e.g. Emperor's Children purple/pink/gold; Night Lords midnight blue; Thousand Sons blue/gold; Word Bearers crimson; Alpha Legion blue-green; Blood Angels red), but only if the legion is sourced.
- For characters who change over the books, describe their most significant depiction and mention the change in `summary`. Examples: Ravenor before and after the Thracian atrocity; Glaw's mechanical body; Fischig's corpse as a host.
- Short quotes of 25 words or fewer are fine as evidence.
