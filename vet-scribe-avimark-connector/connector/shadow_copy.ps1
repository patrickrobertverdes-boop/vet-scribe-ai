$sourcePath = $args[0]
$destPath = $args[1]

# Ensure destination exists
if (!(Test-Path -Path $destPath)) {
    New-Item -ItemType Directory -Path $destPath | Out-Null
    Write-Host "Created destination directory: $destPath"
}

Write-Host "🚀 Starting Shadow Copy from '$sourcePath' to '$destPath'..."

# Use Robocopy for robust, restartable copying
# /MIR :: MIRror a directory tree (equivalent to /E plus /PURGE).
# /R:1 :: number of Retries on failed copies: just 1 retry.
# /W:1 :: Wait time between retries: just 1 second.
# /XO :: eXclude Older files. Only copy if source is newer.
# /FFT :: assume FAT File Times (2-second granularity). Helpful for network shares.
# /NDL :: No Directory List - don't log directory names.
# /NFL :: No File List - don't log file names (unless error).
# /NJH :: No Job Header.
# /NJS :: No Job Summary.

# Note: robocopy exit codes are bitmasks. 0-7 are success/partial success. >=8 is failure.
$robocopyArgs = @(
    $sourcePath,
    $destPath,
    "*.dbf",         # focus only on database files
    "*.fpt",         # memo files (often paired with dbf)
    "/MIR", "/R:1", "/W:1", "/XO", "/FFT", "/NDL", "/NJH", "/NJS"
)

# Execute Robocopy
& robocopy @robocopyArgs

$exitCode = $LASTEXITCODE

# Interpret Robocopy Exit Codes
if ($exitCode -ge 8) {
    Write-Host "❌ Robocopy Failed with Exit Code: $exitCode"
    exit 1
} elseif ($exitCode -ge 0) {
    Write-Host "✅ Shadow Copy Complete. Safe to read from '$destPath'."
    exit 0
} else {
    Write-Host "⚠️ Generic Error: $exitCode"
    exit 1
}
