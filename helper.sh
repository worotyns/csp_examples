#!/bin/bash

# Helper script to generate SHA-384 hashes for script integrity

# Function to generate hash for a file
generate_hash() {
    local file=$1
    if [ ! -f "$file" ]; then
        echo "Error: File $file not found"
        return 1
    fi
    
    local hash=$(openssl dgst -sha384 -binary "$file" | openssl base64 -A)
    echo "Hash for $file:"
    echo "sha384-$hash"
    echo ""
}

# Check if openssl is installed
if ! command -v openssl &> /dev/null; then
    echo "Error: openssl is required but not installed"
    exit 1
fi

# Process files
if [ $# -eq 0 ]; then
    for file in public/*.js; do
        [ -e "$file" ] || continue
        generate_hash "$file"
    done

    for file in third-party-scripts/*.js; do
        [ -e "$file" ] || continue
        generate_hash "$file"
    done
else
    for file in "$@"; do
        generate_hash "$file"
    done
fi
