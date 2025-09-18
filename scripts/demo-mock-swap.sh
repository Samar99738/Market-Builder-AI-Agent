#!/usr/bin/env bash
# Quick helper to run a mock swap (UNIX environments). For Windows, set env vars in PowerShell instead.
export EXECUTE_STRICT=1
export ENABLE_MOCK_SWAP=1
# FOLLOWER_PRIVATE_KEY_BASE58 must already be exported
curl -X POST http://localhost:3001/api/run -H 'Content-Type: application/json' -d '{"strategy":"Buy JitoSOL for 0.005 SOL"}' | jq
