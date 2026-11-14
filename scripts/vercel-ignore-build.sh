#!/usr/bin/env bash
# Vercel "Ignored Build Step" (vercel.json → ignoreCommand). Exit 0 = skip the build, exit 1 = build.
# Skips when everything changed since the last deploy is docs / migrations / notes (saves build minutes).
# Builds whenever it can't tell (first deploy, last deployed commit not in the clone).
set -u
prev="${VERCEL_GIT_PREVIOUS_SHA:-}"
[ -z "$prev" ] && exit 1
git cat-file -e "$prev^{commit}" 2>/dev/null || git fetch -q --depth=100 origin 2>/dev/null
git cat-file -e "$prev^{commit}" 2>/dev/null || exit 1
if git diff --quiet "$prev" HEAD -- . ':(exclude,glob)*.md' ':(exclude,glob)docs/**' ':(exclude,glob).claude/**' ':(exclude,glob)supabase/migrations/**'; then
  echo "Only docs/migrations/notes changed since the last deploy: skipping the build."
  exit 0
fi
exit 1
