# 02: Content check

**What to build:** Bad content can't reach the phone. A content check runs over a content pack as part of the normal test run and fails, with a clear message naming the offending entry, when:
- a Sentence brings in anything other than exactly one new Item at its point in the introduction order;
- an Item ID is used but never defined;
- an audio file is missing;
- a Grammar Note points at an Item that isn't a grammar pattern.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The check runs on the real Korean content pack during the test run, and a failure fails the run
- [ ] Each kind of error has a small sample pack proving the check catches it
- [ ] The error message names the Sentence or Item and what's wrong
- [ ] The current Korean pack passes
