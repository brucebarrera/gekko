#!/bin/bash

cd ..

IMPORT_LOG_FILE_NAME="import_out_$(date +%F).log"

LIVE_LOG_FILE_NAME="live_out_$(date +%F).log"

echo "Running Importer. See logs directory for more details"
# First import data based on config values
node gekko --config config.js --import  > logs/$IMPORT_LOG_FILE_NAME 2>&1

echo "Running live trader see log directory for more details"
node gekko --config config.js > logs/$LIVE_LOG_FILE_NAME 2>&1 &

