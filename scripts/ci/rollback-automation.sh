#!/bin/bash
echo "Compliance breach detected. Initiating automated rollback..."
# Revert to last known good state
git checkout main
./scripts/deploy.sh --force-revert