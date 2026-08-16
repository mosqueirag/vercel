param(
  [Parameter(Mandatory = $true)][string]$WorkbookPath,
  [string]$SourceUpdatedAt = (Get-Date -Format "yyyy-MM-dd"),
  [ValidateSet('manual_admin','csv_import','network_export','verified_internal')][string]$Source = 'csv_import',
  [switch]$DryRun,
  [switch]$AsJson,
  [int]$JsonOffset = 0,
  [int]$JsonLimit = 250
)

$ErrorActionPreference = "Stop"
$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$serviceKey = if ($env:SUPABASE_SECRET_KEY) { $env:SUPABASE_SECRET_KEY } else { $env:SUPABASE_SERVICE_ROLE_KEY }
if (-not $DryRun -and (-not $supabaseUrl -or -not $serviceKey)) { throw "Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY." }
if (-not (Test-Path -LiteralPath $WorkbookPath)) { throw "No existe el archivo indicado." }

function Normalize-Street([string]$Value) {
  $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
  $withoutMarks = -join ($normalized.ToCharArray() | Where-Object { [Globalization.CharUnicodeInfo]::GetUnicodeCategory($_) -ne [Globalization.UnicodeCategory]::NonSpacingMark })
  return (($withoutMarks.ToUpperInvariant() -replace '^(CALLE|AVENIDA|AV|AV\.|BV|BV\.|BOULEVARD|PASAJE|PJE|RUTA)\s+', '') -replace '[^A-Z0-9 ]', ' ' -replace '\s+', ' ').Trim()
}

function Parse-Address([string]$Value) {
  $clean = ($Value.Trim() -replace '\s+', ' ')
  if ($clean -match '^(.*?)\s+N\s*[°ºO.]?\s*(\d{1,6})(?:\b|\s)') { $street=$Matches[1]; $number=[int]$Matches[2] }
  elseif ($clean -match '^(.*?)\s+(\d{1,6})(?:\s*[A-Za-z])?\s*$') { $street=$Matches[1]; $number=[int]$Matches[2] }
  elseif ($clean -match '^\s*(\d{1,6})(?:\s*[A-Za-z])?\s+(.+)$') { $number=[int]$Matches[1]; $street=$Matches[2] }
  else { return $null }
  $normalized = Normalize-Street $street
  if (-not $normalized) { return $null }
  return @{ street_normalized=$normalized; street_number=$number }
}

function Category-Details([string]$Category) {
  $upper=$Category.ToUpperInvariant(); $speed=$null
  if ($upper -match '(\d+)\s*MB') { $speed=[int]$Matches[1] }
  $technology = if ($upper.Contains('ADSL')) {'ADSL'} elseif ($upper.Contains('INALAMBRICO')) {'Internet inalámbrico'} elseif ($upper.Contains('FTTH') -or $upper.Contains('FIBRA')) {'Fibra óptica'} else {'Internet'}
  return @{ technology=$technology; speed_down_mbps=$speed }
}

$resolvedPath = (Resolve-Path -LiteralPath $WorkbookPath).Path
$connection = New-Object System.Data.OleDb.OleDbConnection("Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$resolvedPath;Extended Properties='Excel 8.0;HDR=YES;IMEX=1'")
$jsonRows = [Collections.Generic.List[object]]::new()
try {
  $connection.Open()
  $command = $connection.CreateCommand()
  $command.CommandText = 'SELECT [CATEGORIA], [DIRECCION] FROM [internet$]'
  $reader = $command.ExecuteReader()
  $batch = [Collections.Generic.List[object]]::new(); $seen = [Collections.Generic.HashSet[string]]::new(); $imported=0; $skipped=0; $duplicates=0
  while ($reader.Read()) {
    $category=[string]$reader['CATEGORIA']; $address=[string]$reader['DIRECCION']
    $parsed=Parse-Address $address
    if (-not $parsed -or -not $category) { $skipped++; continue }
    $details=Category-Details $category
    $key = "$($parsed.street_normalized)|$($parsed.street_number)|$($category.Trim())"
    if (-not $seen.Add($key)) { $duplicates++; continue }
    $row = @{street_normalized=$parsed.street_normalized;street_number=$parsed.street_number;plan_name=$category.Trim();technology=$details.technology;speed_down_mbps=$details.speed_down_mbps;coverage_status='available';source=$Source;verified_at="$SourceUpdatedAt`T00:00:00Z";source_updated_at=$SourceUpdatedAt}
    $batch.Add($row)
    if ($AsJson) { $jsonRows.Add($row) }
    if ($batch.Count -ge 250) {
      if (-not $DryRun) {
        $headers=@{apikey=$serviceKey;Authorization="Bearer $serviceKey";Prefer="resolution=merge-duplicates,return=minimal"}
        Invoke-RestMethod -Method Post -Uri "$supabaseUrl/rest/v1/service_address_coverage?on_conflict=street_normalized,street_number,plan_name" -Headers $headers -ContentType 'application/json; charset=utf-8' -Body ($batch | ConvertTo-Json -Depth 5)
      }
      $imported += $batch.Count; $batch.Clear()
    }
  }
  if ($batch.Count -gt 0) {
    if (-not $DryRun) {
      $headers=@{apikey=$serviceKey;Authorization="Bearer $serviceKey";Prefer="resolution=merge-duplicates,return=minimal"}
      Invoke-RestMethod -Method Post -Uri "$supabaseUrl/rest/v1/service_address_coverage?on_conflict=street_normalized,street_number,plan_name" -Headers $headers -ContentType 'application/json; charset=utf-8' -Body ($batch | ConvertTo-Json -Depth 5)
    }
    $imported += $batch.Count
  }
  if ($AsJson) { Write-Output ($jsonRows | Select-Object -Skip $JsonOffset -First $JsonLimit | ConvertTo-Json -Depth 5 -Compress) }
  else {
    $mode = if ($DryRun) { "Validación" } else { "Importación" }
    Write-Host "$mode finalizada. Registros procesados: $imported. Filas omitidas por formato: $skipped. Duplicados omitidos: $duplicates. Fuente: $Source."
  }
} finally {
  if ($reader) { $reader.Dispose() }
  if ($command) { $command.Dispose() }
  $connection.Close(); $connection.Dispose()
}
