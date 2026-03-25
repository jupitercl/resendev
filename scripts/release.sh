#!/bin/bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 0.4.0"
  exit 1
fi

npm version "$VERSION" --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: bump version to $VERSION"
git push
git tag "v$VERSION"
git push origin "v$VERSION"

echo "Released v$VERSION"
