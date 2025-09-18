#!/usr/bin/env python3

import os
import json
from datetime import datetime

# Configuration
import os
ROOT_DIR = os.path.join(os.path.dirname(__file__), '..')

def generate_bash_rename_commands():
    # Check if file_mapping.json exists
    mapping_file = os.path.join(os.path.dirname(__file__), 'file_mapping.json')
    if not os.path.exists(mapping_file):
        print("Error: file_mapping.json not found. Run rename_files.py first.")
        return

    # Load the file mapping
    with open(mapping_file, 'r', encoding='utf-8') as f:
        file_mapping = json.load(f)

    # Generate bash rename commands
    commands = []
    for old_path, new_filename in file_mapping.items():
        old_dir = os.path.dirname(old_path)
        old_filename = os.path.basename(old_path)
        new_path = os.path.join(old_dir, new_filename)

        # Convert Windows paths to Unix-style for the script
        old_dir_unix = old_dir.replace('\\', '/')

        # Escape spaces and special characters in filenames
        old_filename_escaped = old_filename.replace(' ', '\\ ').replace('(', '\\(').replace(')', '\\)')
        new_filename_escaped = new_filename.replace(' ', '\\ ').replace('(', '\\(').replace(')', '\\)')

        # Generate the mv command
        commands.append(f'mv "{old_dir_unix}/{old_filename}" "{old_dir_unix}/{new_filename}"')

    # Write commands to file
    with open(os.path.join(os.path.dirname(__file__), 'rename_commands.sh'), 'w', encoding='utf-8') as f:
        f.write("#!/bin/bash\n")
        f.write("# Bash rename commands\n")
        f.write("# Generated on " + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "\n\n")
        f.write("# Note: This script assumes you're running it from the repository root\n")
        f.write("# If not, change to the repository root first:\n")
        f.write("# cd /path/to/repository/root\n\n")

        for cmd in commands:
            f.write(cmd + "\n")

        # Make the script executable
        f.write("\n# End of rename commands\n")

    # Make the bash script executable
    try:
        os.chmod(os.path.join(os.path.dirname(__file__), 'rename_commands.sh'), 0o755)
    except Exception:
        print("Note: Could not make rename_commands.sh executable. You may need to run: chmod +x rename_commands.sh")

    print(f"Generated {len(commands)} bash rename commands in rename_commands.sh")

if __name__ == "__main__":
    generate_bash_rename_commands()
