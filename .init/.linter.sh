#!/bin/bash
cd /home/kavia/workspace/code-generation/unified-cloud-resource-manager-57683-57692/react_frontend_dashboard
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

