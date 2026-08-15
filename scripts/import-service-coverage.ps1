param(
  [Parameter(Mandatory = $true)][string]$WorkbookPath,
  [string]$SourceUpdatedAt = (Get-Date -Format "yyyy-MM-dd"),
  [switch]$DryRun
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
try {
  $connection.Open()
  $command = $connection.CreateCommand()
  $command.CommandText = 'SELECT [CATEGORIA], [DIRECCION] FROM [internet$]'
  $reader = $command.ExecuteReader()
  $batch = [Collections.Generic.List[object]]::new(); $imported=0; $skipped=0
  while ($reader.Read()) {
    $category=[string]$reader['CATEGORIA']; $address=[string]$reader['DIRECCION']
    $parsed=Parse-Address $address
    if (-not $parsed -or -not $category) { $skipped++; continue }
    $details=Category-Details $category
    $batch.Add(@{street_normalized=$parsed.street_normalized;street_number=$parsed.street_number;plan_name=$category.Trim();technology=$details.technology;speed_down_mbps=$details.speed_down_mbps;source_updated_at=$SourceUpdatedAt})
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
  $mode = if ($DryRun) { "Validación" } else { "Importación" }
  Write-Host "$mode finalizada. Registros procesados: $imported. Filas omitidas por formato: $skipped."
} finally {
  if ($reader) { $reader.Dispose() }
  if ($command) { $command.Dispose() }
  $connection.Close(); $connection.Dispose()
}
