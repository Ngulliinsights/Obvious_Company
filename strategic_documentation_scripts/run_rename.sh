#!/bin/bash

echo "Running file renaming script..."
echo ""

python rename_files.py

echo ""
echo "Generating bash rename commands..."
python generate_bash_rename.py

echo ""
echo "Script execution complete."
echo "Please review the generated files before applying changes:"
echo "1. rename_commands.ps1 - PowerShell commands for Windows"
echo "2. rename_commands.sh - Bash commands for Linux/macOS"
echo "3. file_mapping.json - JSON mapping of old to new filenames"
echo "4. manual_review.txt - Files that need manual review"
echo ""
echo "To apply the rename commands on Linux/macOS, run:"
echo "    chmod +x rename_commands.sh"
echo "    ./rename_commands.sh"
echo ""