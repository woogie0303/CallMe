# Reread

An app for readers who get stuck on an expression in a foreign-language book: save it on
the spot, then relearn it later through the sentence it actually appeared in. The audience
is Korean speakers who struggle to read books in a foreign language, and the MVP covers a
single pair — English to Korean.

## Language

Each term is named in English first; the parenthesized Korean is the name that appears in
the UI. `_Avoid_` lists names that must not be used for the concept — in code, in
conversation, or in UI copy.

**Lexical Item (어휘 항목)**:
A unit of language the reader saved because they did not know it. It may be a single word
(`resign`), or a phrasal verb or collocation (`make out`, `for the time being`). Saving the
same item a second time makes that second save a *Re-encounter*.
_Avoid_: Word / 단어 (excludes phrasal verbs, so it is inaccurate), Vocabulary, Term

**Ask (질문)**:
The unit of a request to the AI is always a **whole sentence**, never a bare lexical item.
One ask returns the sentence's Korean translation plus a set of *Candidates*. Because the
model always sees the surrounding line, the sense it reports is the sense on the page.
_Avoid_: Lookup / 검색, Query, Translation request

**Candidate (추천 항목)**:
A lexical item the AI proposes as worth memorizing out of an asked sentence, chosen against
the reader's declared level. A candidate is only a suggestion — it becomes a lexical item
in the drawer when the reader picks it.
_Avoid_: Suggestion / 제안, Extraction, Highlight

**Sentence (문장)**:
One line copied verbatim from the book. It is a **record separate from** a lexical item,
and there are two reasons to save one, which decide where it lives — it contains a lexical
item the reader did not know, and so is reachable through that item in the *Drawer*; or the
reader simply liked it, and so belongs to the *Book* alone, with no lexical item attached.
_Avoid_: Quote / 인용, 구절, 예문

**Pending Ask (대기 중인 질문)**:
A sentence captured while the answer could not be fetched — no network, or the reader's
monthly asks are spent. Capture never fails: the sentence is stored and resolves later.
A pile of pending asks is the reader's own reason to upgrade, so it is a surface, not an error.
_Avoid_: Failed ask, Error, 오류

**Level (레벨)**:
The reader's self-declared English level — beginner, intermediate, advanced. It decides
which candidates an ask returns and how deeply their meanings are explained, so meanings are
per-reader, not shared facts. It is asked again each time a book is finished.
_Avoid_: Proficiency, Grade, 등급

**Re-encounter (재회)**:
The event the app notices when the reader tries to save a lexical item they already have,
from a different book or a different sentence. The app does not create a new record — it
attaches one more sentence to the existing item and says "You saved this same one from this
sentence on March 20." This is the one thing Bookmori (북모리) does not have.
_Avoid_: Duplicate / 중복, 재저장

**Book (책)**:
The source of a sentence, and the reading record itself — progress, and the sentences the
reader liked but saved no lexical item from. A lexical item does not belong to a book —
traveling across several books is what a lexical item does, and that movement is exactly
what a re-encounter is.
_Avoid_: Work / 작품, 도서

**Drawer (서랍)**:
Where saved lexical items pile up, one card per item, never per sentence. Opening an item
shows every sentence it was met in, which is what makes a re-encounter visible after the
moment it happened. Sentences saved only because the reader liked them are not here — they
live on their *Book*.
_Avoid_: Wordbook / 단어장, Notes / 노트, Collection / 컬렉션
