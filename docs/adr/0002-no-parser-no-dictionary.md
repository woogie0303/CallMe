# One model call replaces both the phrase parser and the dictionary

An earlier design ran a Python spaCy microservice to find phrasal verbs by dependency
parsing (`prt`), then looked the result up in MongoDB, falling back to DeepL. Both halves are
removed: the model that answers an ask (see ADR-0001) already segments the sentence into
memorizable units as a side effect of explaining it.

## Considered Options

Keeping spaCy as an offline fallback or as a pre-highlight for perceived speed was
considered and rejected — a second segmenter will sometimes disagree with the first, and
maintaining a Python runtime for a degraded path is not worth it in a pnpm/Turborepo/NestJS
monorepo.

## Consequences

- **Coverage improves rather than degrades.** `prt` parsing caught 3 of 7 representative
  items and missed `for the time being`, `come to terms with`, `the better part of`, and
  `take after` — none of which are verb + particle. A model reading the full line catches all
  of them, and calibrates them to the reader's level besides.
- No second language runtime, deploy target, or CI job.
- **No dictionary API is integrated at all.** There is no free official EN→KO dictionary:
  국립국어원's API is Korean-headword (wrong direction), Naver's are unofficial scrapers,
  Papago's open API was terminated 2025-03-20, and dictionaryapi.dev returns English
  definitions — and ranked the _cheque_ sense of `make out` first when tested.
