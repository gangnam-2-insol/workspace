# Requires: PowerShell 7+

param(
    [string]$Root = (Get-Location).Path,
    [string]$Output = 'COMBINED_README.md'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$outPath = Join-Path $Root $Output

# Collect README-like files (case-insensitive)
$files = Get-ChildItem -Path $Root -Recurse -File |
    Where-Object { $_.Name -match '(?i)readme' } |
    Where-Object { $_.Extension -match '^(?i)\.md$' } |
    Sort-Object FullName

# Write header
"# Combined README`n`n본 문서는 저장소 내 모든 README 관련 문서를 한 파일로 통합한 것입니다. 각 섹션의 제목에 원본 파일 경로를 명시했습니다.`n" |
    Set-Content -Path $outPath -Encoding UTF8

foreach ($file in $files) {
    $relPath = Resolve-Path -Relative $file.FullName
    "`n---`n## [$relPath]`n" | Add-Content -Path $outPath -Encoding UTF8
    Get-Content -Path $file.FullName -Raw | Add-Content -Path $outPath -Encoding UTF8
}

Write-Host "Combined README created at: $outPath"

