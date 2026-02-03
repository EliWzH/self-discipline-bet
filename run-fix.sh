#!/bin/bash
cd "$(dirname "$0")/server"
echo "开始修复钱包金额..."
node fix-wallet-amounts.js
