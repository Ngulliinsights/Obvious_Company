@echo off
echo Running file renaming script...
echo.

python rename_files.py

echo.
echo Script execution complete.
echo Please review the generated files before applying changes:
echo 1. rename_commands.ps1 - PowerShell commands to rename files
echo 2. file_mapping.json - JSON mapping of old to new filenames
echo 3. manual_review.txt - Files that need manual review
echo.
echo To apply the rename commands, run PowerShell as administrator and execute:
echo    .\rename_commands.ps1
echo.
pause