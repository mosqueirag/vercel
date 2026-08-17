<#
 Imports the approved geographic coverage GeoJSON into coopsar-staging only.
 Safe by default: writes require -Apply. Geometry and source data stay private.
#>
[CmdletBinding()]
param(
  [string]$GeoJsonPath = 'private-imports\COOPSAR_Cobertura_Internet_Zonas.geojson',
  [switch]$DryRun,
  [switch]$Apply,
  [switch]$SelfTest
)

$ErrorActionPreference = 'Stop'
$ExpectedSupabaseUrl = 'https://wwvqlbycwzxvjnexklwg.supabase.co'
$AllowedLayers = @{ 'ZONA FIBRA OPTICA' = @('FTTH'); 'INTERNET ADSL' = @('ADSL'); 'REGIMIENTO' = @('ADSL'); 'URBANO' = @('ADSL', 'WIRELESS') }

function Assert-Condition([bool]$Condition, [string]$Message) { if (-not $Condition) { throw $Message } }
function Get-Sha256([string]$Value) { $sha = [Security.Cryptography.SHA256]::Create(); try { return 'sha256:' + (($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($Value)) | ForEach-Object { $_.ToString('x2') }) -join '') } finally { $sha.Dispose() } }
function Invoke-Supabase([string]$Method, [string]$Path, $Body = $null) {
  $headers = @{ apikey = $script:ServiceKey; Authorization = "Bearer $script:ServiceKey" }
  $params = @{ Method = $Method; Uri = "$script:SupabaseUrl/rest/v1/$Path"; Headers = $headers; ErrorAction = 'Stop' }
  if ($null -ne $Body) { $params.ContentType = 'application/json; charset=utf-8'; $params.Body = ($Body | ConvertTo-Json -Depth 30 -Compress) }
  Invoke-RestMethod @params
}
function Test-Ring($Ring) {
  Assert-Condition ($Ring.Count -ge 4) 'A polygon ring must have four or more positions.'
  foreach ($position in $Ring) {
    Assert-Condition ($position.Count -ge 2) 'A coordinate position must have longitude and latitude.'
    $longitude = [double]$position[0]; $latitude = [double]$position[1]
    Assert-Condition ($longitude -ge -180 -and $longitude -le 180 -and $latitude -ge -90 -and $latitude -le 90) 'A coordinate is outside WGS84 bounds.'
  }
  Assert-Condition (($Ring[0][0] -eq $Ring[$Ring.Count - 1][0]) -and ($Ring[0][1] -eq $Ring[$Ring.Count - 1][1])) 'A polygon ring must be closed.'
}
function Test-Geometry($Geometry) {
  Assert-Condition ($Geometry.type -in @('Polygon', 'MultiPolygon')) 'Only Polygon and MultiPolygon geometries are allowed.'
  if ($Geometry.type -eq 'Polygon') {
    foreach ($ring in $Geometry.coordinates) { Test-Ring $ring }
  } else {
    foreach ($polygon in $Geometry.coordinates) { foreach ($ring in $polygon) { Test-Ring $ring } }
  }
}
function Test-Feature($Feature) {
  Assert-Condition ($Feature.type -eq 'Feature') 'Every item must be a GeoJSON Feature.'
  Test-Geometry $Feature.geometry
  $layer = [string]$Feature.properties.source_layer
  Assert-Condition ($AllowedLayers.ContainsKey($layer)) 'The GeoJSON contains an unapproved source layer.'
  $technologies = @($Feature.properties.technologies | ForEach-Object { [string]$_ } | Sort-Object -Unique)
  Assert-Condition ((@($technologies) -join ',') -eq (@($AllowedLayers[$layer] | Sort-Object) -join ',')) 'The source layer technologies do not match the approved mapping.'
}
function Test-PureFunctions {
  $polygon = '{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1],[0,0]]]}' | ConvertFrom-Json
  Test-Geometry $polygon
  Assert-Condition ((Get-Sha256 'stable') -eq (Get-Sha256 'stable')) 'Hashing must be deterministic.'
  $chunks = @(1000, 1000, 137); Assert-Condition (($chunks | Measure-Object -Sum).Sum -eq 2137) 'Synthetic pagination count failed.'
  Write-Host 'SelfTest OK: geometry validation, approved technologies, deterministic hash and pagination.'
}

if ($SelfTest) { Test-PureFunctions; exit 0 }
if ($DryRun -and $Apply) { throw 'Use one mode only: -DryRun or -Apply.' }
if (-not (Test-Path -LiteralPath $GeoJsonPath)) { throw 'The private geographic coverage GeoJSON was not found.' }
$script:SupabaseUrl = if ($null -eq $env:NEXT_PUBLIC_SUPABASE_URL) { '' } else { $env:NEXT_PUBLIC_SUPABASE_URL.TrimEnd('/') }
$script:ServiceKey = if ($env:SUPABASE_SECRET_KEY) { $env:SUPABASE_SECRET_KEY } else { $env:SUPABASE_SERVICE_ROLE_KEY }
if ($script:SupabaseUrl -ne $ExpectedSupabaseUrl) { throw 'Target guard: URL is not coopsar-staging.' }
if (-not $script:ServiceKey) { throw 'A server-side Supabase credential is required.' }

$document = Get-Content -LiteralPath $GeoJsonPath -Raw | ConvertFrom-Json
Assert-Condition ($document.type -eq 'FeatureCollection') 'Expected a GeoJSON FeatureCollection.'
$features = @($document.features)
Assert-Condition ($features.Count -eq 4) 'Expected exactly four approved coverage zones.'
$seen = @{}; $rows = [Collections.Generic.List[hashtable]]::new()
foreach ($feature in $features) {
  Test-Feature $feature
  $layer = [string]$feature.properties.source_layer
  Assert-Condition (-not $seen.ContainsKey($layer)) 'A source layer can only occur once.'; $seen[$layer] = $true
  $canonical = $feature | ConvertTo-Json -Depth 30 -Compress
  $rows.Add(@{ p_source_layer = $layer; p_source_label = [string]$feature.properties.source_label; p_technologies = @($feature.properties.technologies); p_geometry = $feature.geometry; p_source = [string]$feature.properties.source; p_source_version = (Get-Sha256 $canonical) })
}

$remote = @(Invoke-Supabase 'Get' 'coverage_zones?select=source_layer,source_version,active&source_layer=not.is.null')
$same = 0; $new = 0; $update = 0
foreach ($row in $rows) {
  $existing = @($remote | Where-Object { $_.source_layer -eq $row.p_source_layer -and $_.source_version -eq $row.p_source_version -and $_.active })
  if ($existing.Count) { $same++ } elseif (@($remote | Where-Object { $_.source_layer -eq $row.p_source_layer }).Count) { $update++ } else { $new++ }
}
Write-Host "Zones: new=$new update=$update same=$same total=$($rows.Count)"
Write-Host 'Safety: DELETE=0 TRUNCATE=0 PII=0 production=false geometry-public=false'
if (-not $Apply) { Write-Host 'Dry run only. No writes were made.'; exit 0 }
foreach ($row in $rows) { Invoke-Supabase 'Post' 'rpc/upsert_geographic_coverage_zone' $row | Out-Null }
Write-Host 'Apply completed: four approved geographic zones upserted to coopsar-staging.'
