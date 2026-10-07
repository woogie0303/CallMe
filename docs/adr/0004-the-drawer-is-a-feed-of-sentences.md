# The drawer is a feed of sentences, not a list of items

ADR-0001 settled what we _send_ to the model: never a bare word, always the whole sentence,
because a phrase stripped of its line has no single correct Korean. This decision carries the
same argument one step further, to what the reader _sees afterwards_. The drawer holds
sentences. A lexical item is no longer a row of its own — it is an underline inside the
sentence it was met in, and it is reached by going through that sentence.

Korean is not shown beside the English. A saved sentence renders as English alone; the
translation and an item's meaning appear only when the reader asks for them, and they open
below the line rather than beside it.

## Considered Options

Keeping one card per item and merely restyling it was the cheaper option, and it would not
have required this ADR. It was rejected because the shape of the list is itself the claim.
A column of English headwords with Korean glosses underneath is a 단어장 — the exact artifact
ADR-0001 refused to build — and a reader scanning that column is reading the Korean, because
the Korean is the part they understand. Changing the typography of that column does not change
what the eye does with it. If the sentence is the unit of asking, it has to be the unit of
remembering too, or the app teaches one habit and then files it away as another.

Adding a sentence feed _alongside_ the item drawer was also considered and rejected: it leaves
the reader choosing between two doors to the same material on every visit, which is the kind
of ambiguity that made the capture flow slow in the first place.

## Consequences

- **The lexical item and the re-encounter survive unchanged.** Only the entrance moves. The
  record is still one document per `(readerId, term)`, re-encounter is still created by that
  unique index, and opening an underline still shows every sentence the item was met in —
  which is, as before, where a re-encounter becomes visible. Nothing about _Re-encounter_ or
  _Lexical Item_ in `CONTEXT.md` changes.
- **A sentence saved without an ask is no longer a dead end.** Previously a liked-only sentence
  lived on its book with nothing to do; in a feed it sits next to answered sentences and can be
  asked about later. This is what forced `sentenceId?` onto `CreateAskDto` — without it, asking
  about a stored sentence duplicates the row.
- **Highlight ranges exist only for asked sentences.** `surface` comes from the model at ask
  time and ADR-0002 rules out a dictionary, so there is no way to re-derive an underline for a
  sentence that was never asked. Unasked sentences render as plain English, correctly.
- **Deleting a sentence is now a reachable action, and it cascades.** `DELETE /api/sentences/:id`
  pulls that encounter from every item and removes any item left with none. In an item-first
  drawer this path was buried; in a feed it is one swipe away, so the confirmation has to count
  and name the items that would go with it.
- The drawer's filters stop describing item state (외웠어요 / 헷갈려요) and start describing
  sentence state (not yet asked / has items / has a re-encounter). Item status is still edited,
  but from inside an item.
