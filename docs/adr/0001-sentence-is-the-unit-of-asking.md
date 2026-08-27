# The unit of asking is a sentence, never a bare word

Readers stall on phrases whose meaning is not the sum of their parts (`make out`,
`for the time being`), and a phrase stripped of its sentence has no single correct Korean —
`make out` is 겨우 알아보다 in one line and 애정행각 in another. So every request to the model
carries the **whole sentence**, and one ask returns the sentence's translation plus several
candidate items at once. Sense disambiguation then costs nothing: it falls out of the model
seeing the line, rather than being something we engineer.

## Considered Options

Looking up the extracted phrase on its own — via a dictionary API or machine translation —
was the original design. It is cheaper and cacheable, but it reproduces exactly the failure
that motivated this product: the author memorized Anki cards with Korean on one side and
English on the other, stripped of context, and could not recognize the same words when they
reappeared in a book. Shipping a context-free gloss would make the app an automated version
of the thing that did not work.

## Consequences

- **Caching answers is pointless.** Expressions repeat across readers; sentences do not, so a
  sentence-keyed cache would essentially never hit. Cost scales with usage, permanently.
  Anthropic prompt caching on the stable system prefix is the caching that still applies.
- Cost per *item* is nonetheless low, because one call yields every candidate in the line.
- There is no offline path. Capture must therefore always succeed and resolve later — see the
  *Pending Ask* term in `CONTEXT.md`.
- Asking about a bare word is not offered during capture, because a reader always has a
  sentence in front of them.
