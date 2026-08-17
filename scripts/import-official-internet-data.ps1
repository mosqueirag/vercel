<#
  Imports the private, approved COOPSAR Internet/Fiber master workbook into the
  linked STAGING project only.  It never reads the legacy `internet` worksheet.
  Safe default: no writes happen unless -Apply is explicitly provided.
#>
[CmdletBinding()]
param(
  [string]$WorkbookPath = (Join-Path $PSScriptRoot '..\private-imports\COOPSAR_Datos_Internet_Fibra_MAESTRO.xlsx'),
  [switch]$DryRun,
  [switch]$Apply,
  [switch]$SelfTest
)

$ErrorActionPreference = 'Stop'
$ExpectedSupabaseUrl = 'https://wwvqlbycwzxvjnexklwg.supabase.co'
$BatchSize = 200

function Assert-Condition([bool]$Condition, [string]$Message) {
  if (-not $Condition) { throw $Message }
}

function Get-Text($Value) {
  if ($null -eq $Value) { return $null }
  $text = ([string]$Value).Trim()
  if ([string]::IsNullOrWhiteSpace($text)) { return $null }
  return $text
}

function Get-Confirmed([string]$Value) { $text = Get-Text $Value; return ($text -eq 'CONFIRMADO') }

function Normalize-Null([string]$Value) {
  $text = Get-Text $Value
  if ($null -eq $text) { return $null }
  if ($text.ToUpperInvariant() -in @('NO ESPECIFICADO', 'PENDIENTE', 'N/A', 'NA', '-', 'SIN DEFINIR')) { return $null }
  return $text
}

function Remove-Diacritics([string]$Value) {
  $formD = $Value.Normalize([Text.NormalizationForm]::FormD)
  return -join ($formD.ToCharArray() | Where-Object {
    [Globalization.CharUnicodeInfo]::GetUnicodeCategory($_) -ne [Globalization.UnicodeCategory]::NonSpacingMark
  })
}

function Normalize-Street([string]$Value) {
  $text = Normalize-Null $Value
  if ($null -eq $text) { return $null }
  $text = Remove-Diacritics $text
  return (($text.ToUpperInvariant() -replace '^(CALLE|AVENIDA|AV\.?|BV\.?|BOULEVARD|PASAJE|PJE\.?)\s+', '') -replace '[^A-Z0-9 ]', ' ' -replace '\s+', ' ').Trim()
}

function Normalize-Technology([string]$Value) {
  $text = Normalize-Null $Value
  if ($null -eq $text) { return $null }
  $canonical = (Remove-Diacritics $text).ToUpperInvariant().Trim()
  if ($canonical -in @('FIBRA OPTICA', 'FTTH')) { return 'FTTH' }
  if ($canonical -eq 'ADSL') { return 'ADSL' }
  if ($canonical -eq 'INTERNET INALAMBRICO') { return ('Internet inal' + [char]0x00E1 + 'mbrico') }
  return $null
}

function Normalize-Audience([string]$Value) {
  $text = Normalize-Null $Value
  if ($null -eq $text) { return $null }
  switch -Regex ((Remove-Diacritics $text).ToUpperInvariant()) {
    '^HOGAR$' { return 'home' }
    '^(COMERCIAL|COMERCIO)$' { return 'business' }
    '^(EMPRESA|EMPRESAS)$' { return 'enterprise' }
    '^(TODOS|GENERAL)$' { return 'all' }
    default { return $null }
  }
}

function New-Slug([string]$Value) {
  $text = Normalize-Null $Value
  if ($null -eq $text) { return $null }
  $slug = ((Remove-Diacritics $text).ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
  if ($slug.Length -lt 2) { return $null }
  return $slug.Substring(0, [Math]::Min(120, $slug.Length))
}

function Get-Number($Value) {
  $text = Normalize-Null $Value
  if ($null -eq $text) { return $null }
  $result = 0.0
  if (-not [double]::TryParse($text, [Globalization.NumberStyles]::Any, [Globalization.CultureInfo]::InvariantCulture, [ref]$result)) {
    if (-not [double]::TryParse($text, [Globalization.NumberStyles]::Any, [Globalization.CultureInfo]::GetCultureInfo('es-AR'), [ref]$result)) { return $null }
  }
  return $result
}

function Get-Integer($Value) {
  $number = Get-Number $Value
  if ($null -eq $number -or $number -ne [Math]::Truncate($number)) { return $null }
  return [int]$number
}

function Get-OrDefault($Value, $Default) {
  if ($null -eq $Value) { return $Default }
  return $Value
}

function Get-IsoDate($Value) {
  if ($Value -is [datetime]) { return $Value.ToUniversalTime().ToString('o') }
  $text = Normalize-Null $Value
  if ($null -eq $text) { return $null }
  $parsed = [datetime]::MinValue
  if ([datetime]::TryParse($text, [Globalization.CultureInfo]::GetCultureInfo('es-AR'), [Globalization.DateTimeStyles]::AssumeLocal, [ref]$parsed)) { return $parsed.ToUniversalTime().ToString('o') }
  return $null
}

function Convert-Row($Reader) {
  $row = @{}
  for ($i = 0; $i -lt $Reader.FieldCount; $i++) { $value = if ($Reader.IsDBNull($i)) { $null } else { $Reader.GetValue($i) }; $row[$Reader.GetName($i)] = $value; $row["__$i"] = $value }
  return $row
}

function Read-Worksheet([string]$ConnectionString, [string]$Sheet, [string]$Range) {
  $connection = New-Object System.Data.OleDb.OleDbConnection($ConnectionString)
  $rows = [Collections.Generic.List[hashtable]]::new()
  try {
    $connection.Open(); $command = $connection.CreateCommand(); $command.CommandText = "SELECT * FROM [$Sheet`$$Range]"
    $reader = $command.ExecuteReader()
    try {
      while ($reader.Read()) {
        $row = Convert-Row $reader
        $hasContent = @($row.Keys | Where-Object { $_ -notlike '__*' -and $null -ne $row[$_] -and -not [string]::IsNullOrWhiteSpace([string]$row[$_]) }).Count -gt 0
        if ($hasContent) { $rows.Add($row) }
      }
    } finally { $reader.Dispose() }
  } finally {
    if ($command) { $command.Dispose() }; $connection.Close(); $connection.Dispose()
  }
  return $rows
}

function Get-ObjectValue($Row, [string]$Name) { return $Row[$Name] }
function Get-Cell($Row, [int]$Index) { return $Row["__$Index"] }

function Get-RowSignature($Row, [string[]]$Fields) { return (($Fields | ForEach-Object { "$($_)=$($Row[$_])" }) -join '|') }

function Invoke-Supabase([string]$Method, [string]$Path, $Body = $null, [hashtable]$ExtraHeaders = @{}) {
  $headers = @{ apikey = $script:ServiceKey; Authorization = "Bearer $script:ServiceKey" }
  foreach ($key in $ExtraHeaders.Keys) { $headers[$key] = $ExtraHeaders[$key] }
  $params = @{ Method = $Method; Uri = "$script:SupabaseUrl/rest/v1/$Path"; Headers = $headers; ErrorAction = 'Stop' }
  if ($null -ne $Body) { $params.ContentType = 'application/json; charset=utf-8'; $params.Body = ($Body | ConvertTo-Json -Depth 8 -Compress) }
  return Invoke-RestMethod @params
}

function Get-AllRows([string]$Path) {
  $all = [Collections.Generic.List[object]]::new(); $from = 0
  while ($true) {
    $rows = @(Invoke-Supabase 'Get' "$Path&offset=$from&limit=1000")
    foreach ($row in $rows) { $all.Add($row) }
    if ($rows.Count -lt 1000) { break }; $from += 1000
  }
  return $all
}

function Invoke-BatchedUpsert([string]$Table, [string]$ConflictColumns, [object[]]$Rows) {
  for ($offset = 0; $offset -lt $Rows.Count; $offset += $BatchSize) {
    $end = [Math]::Min($offset + $BatchSize - 1, $Rows.Count - 1)
    Invoke-Supabase 'Post' "$Table?on_conflict=$ConflictColumns" $Rows[$offset..$end] @{ Prefer = 'resolution=merge-duplicates,return=minimal' } | Out-Null
  }
}

function Test-PureFunctions {
  $normalizedTechnology = Normalize-Technology -Value ('Fibra ' + [char]0x00F3 + 'ptica')
  Assert-Condition ($normalizedTechnology -eq 'FTTH') "Technology normalization failed: [$normalizedTechnology]."
  Assert-Condition ((Normalize-Technology 'Internet') -eq $null) 'Unknown technology must not receive a fallback.'
  Assert-Condition ((Normalize-Audience 'No especificado') -eq $null) 'Unknown audience must remain null.'
  Assert-Condition ((New-Slug 'Plan Hogar 50 MB') -eq 'plan-hogar-50-mb') 'Slug generation failed.'
  Assert-Condition ((Normalize-Street ('Av. San Mart' + [char]0x00ED + 'n')) -eq 'SAN MARTIN') 'Street normalization failed.'
  Write-Host 'SelfTest OK: normalización de tecnología, nulos, slug y calle.'
}

if ($SelfTest) { Test-PureFunctions; exit 0 }
if ($DryRun -and $Apply) { throw 'Use one mode only: -DryRun or -Apply.' }
if (-not (Test-Path -LiteralPath $WorkbookPath)) { throw 'No se encontró el Excel maestro privado.' }

$script:SupabaseUrl = (Get-OrDefault $env:NEXT_PUBLIC_SUPABASE_URL '').TrimEnd('/')
$script:ServiceKey = if ($env:SUPABASE_SECRET_KEY) { $env:SUPABASE_SECRET_KEY } else { $env:SUPABASE_SERVICE_ROLE_KEY }
if ($script:SupabaseUrl -ne $ExpectedSupabaseUrl) { throw 'Target guard: la URL no corresponde a coopsar-staging.' }
if (-not $script:ServiceKey) { throw 'Falta una credencial server-side de Supabase para comparar con staging.' }

$resolvedWorkbook = (Resolve-Path -LiteralPath $WorkbookPath).Path
$connectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$resolvedWorkbook;Extended Properties='Excel 12.0 Xml;HDR=YES;IMEX=1'"
$plansSheet = Read-Worksheet $connectionString 'PLANES' 'A4:S'
$contactsSheet = Read-Worksheet $connectionString 'CONTACTOS' 'A4:K'
$coverageSheet = Read-Worksheet $connectionString 'COBERTURA' 'A4:L'
$faqSheet = Read-Worksheet $connectionString 'FAQ_INTERNET' 'A4:I'
$reviewSheet = Read-Worksheet $connectionString 'COBERTURA_REVISAR' 'A4:D'

$plans = [Collections.Generic.List[hashtable]]::new(); $planErrors = 0
foreach ($row in $plansSheet) {
  if (-not (Get-Confirmed (Get-Cell $row 0))) { continue }
  $name = Normalize-Null (Get-Cell $row 2); $slug = Normalize-Null (Get-Cell $row 3)
  if ($null -eq $slug) { $slug = New-Slug $name }
  if ($null -eq $name -or $null -eq $slug) { $planErrors++; continue }
  $benefitText = Normalize-Null (Get-Cell $row 13); $benefits = @($benefitText -split ';' | ForEach-Object { Normalize-Null $_ } | Where-Object { $_ })
  $plans.Add(@{ slug=$slug; name=$name; audience=(Normalize-Audience (Get-Cell $row 4)); technology=(Normalize-Technology (Get-Cell $row 5)); speed_down_mbps=(Get-Integer (Get-Cell $row 6)); speed_up_mbps=(Get-Integer (Get-Cell $row 7)); price_amount=(Get-Number (Get-Cell $row 8)); currency=(Normalize-Null (Get-Cell $row 9)); installation_price=(Get-Number (Get-Cell $row 10)); installation_notes=(Normalize-Null (Get-Cell $row 11)); description=(Normalize-Null (Get-Cell $row 12)); benefits=$benefits; conditions=(Normalize-Null (Get-Cell $row 14)); sort_order=([int](Get-OrDefault (Get-Integer (Get-Cell $row 15)) 0)); status='draft'; published_at=$null })
}

$contacts = [Collections.Generic.List[hashtable]]::new(); $contactErrors = 0
foreach ($row in $contactsSheet) {
  if (-not (Get-Confirmed (Get-Cell $row 0))) { continue }
  $service=Normalize-Null (Get-Cell $row 2); $type=Normalize-Null (Get-Cell $row 3); $purpose=Normalize-Null (Get-Cell $row 6); $value=Normalize-Null (Get-Cell $row 5)
  if ($null -eq $service -or $null -eq $type -or $null -eq $purpose -or $null -eq $value) { $contactErrors++; continue }
  $publishedAt=Get-IsoDate (Get-Cell $row 8); if ($null -eq $publishedAt) { $publishedAt=(Get-Date).ToUniversalTime().ToString('o') }
  $contacts.Add(@{ service=$service.ToLowerInvariant(); channel_type=$type.ToLowerInvariant(); label=(Normalize-Null (Get-Cell $row 4)); value=$value; public_value=$value; purpose=$purpose.ToLowerInvariant(); sort_order=([int](Get-OrDefault (Get-Integer (Get-Cell $row 7)) 0)); status='published'; published_at=$publishedAt; updated_by_email=$null })
}

$wirelessTechnology = 'Internet inal' + [char]0x00E1 + 'mbrico'
$coverage = [Collections.Generic.List[hashtable]]::new(); $coverageInvalid=0; $coverageDuplicates=0; $coverageReviewRequired=0; $coverageTechnologies=@{ FTTH=0; ADSL=0; $wirelessTechnology=0 }; $coverageSeen=[Collections.Generic.HashSet[string]]::new()
foreach ($row in $coverageSheet) {
  if (-not (Get-Confirmed (Get-Cell $row 0))) { $coverageReviewRequired++; continue }
  $street=Normalize-Street (Get-Cell $row 1); $number=Get-Integer (Get-Cell $row 2); $technology=Normalize-Technology (Get-Cell $row 6)
  if ($null -eq $street -or $null -eq $number -or $null -eq $technology) { $coverageInvalid++; continue }
  $key="$street|$number|$technology"; if (-not $coverageSeen.Add($key)) { $coverageDuplicates++; continue }
  $coverageTechnologies[$technology]++
  $coverage.Add(@{ street_normalized=$street; street_number=$number; technology=$technology; coverage_status='available'; source='verified_internal'; verified_at=(Get-IsoDate (Get-Cell $row 9)); plan_name=$null; plan_id=$null })
}

$faqs = [Collections.Generic.List[hashtable]]::new(); $faqErrors=0
foreach ($row in $faqSheet) {
  $question=Normalize-Null (Get-Cell $row 3); $answer=Normalize-Null (Get-Cell $row 4); $category=Normalize-Null (Get-Cell $row 2)
  if ($null -eq $question -or $null -eq $answer -or $null -eq $category) { $faqErrors++; continue }
  $faqs.Add(@{ question=$question; answer=$answer; category=$category; sort_order=([int](Get-OrDefault (Get-Integer (Get-Cell $row 5)) 0)); status='draft'; published_at=$null; service_id=$null })
}

# Query staging before any write. The output is aggregate-only by design.
$existingPlans=@{}; foreach($row in (Get-AllRows 'internet_plans?select=slug,name,audience,technology,speed_down_mbps,speed_up_mbps,price_amount,currency,installation_price,installation_notes,description,benefits,conditions,sort_order,status,published_at')) { $existingPlans[$row.slug]=$row }
$existingContacts=@{}; foreach($row in (Get-AllRows 'public_contact_channels?select=service,channel_type,purpose,label,value,public_value,sort_order,status,published_at')) { $existingContacts["$($row.service)|$($row.channel_type)|$($row.purpose)"]=$row }
$existingCoverage=@{}; foreach($row in (Get-AllRows 'service_address_coverage?select=street_normalized,street_number,technology,coverage_status,source,verified_at,plan_name,plan_id')) { $existingCoverage["$($row.street_normalized)|$($row.street_number)|$($row.technology)"]=$row }
$existingFaqs=@{}; foreach($row in (Get-AllRows 'faqs?select=id,question,answer,category,sort_order,status,published_at')) { $existingFaqs["$($row.category)|$($row.question)"]=$row }

function Get-ChangeCounts {
  param([object[]]$Rows, [hashtable]$ExistingMap, [scriptblock]$Key)
  $counts=@{ new=0; update=0; same=0 }
  foreach($row in $Rows) {
    $rowKey = & $Key $row
    $existing = $ExistingMap[$rowKey]
    if ($null -eq $existing) { $counts.new++ }
    elseif ((Get-RowSignature $row @($row.Keys | Where-Object { $_ -notin @('id','updated_at','created_at') })) -eq (Get-RowSignature $existing @($row.Keys | Where-Object { $_ -notin @('id','updated_at','created_at') }))) { $counts.same++ }
    else { $counts.update++ }
  }
  return $counts
}
$planCounts=Get-ChangeCounts -Rows ($plans.ToArray()) -ExistingMap $existingPlans -Key { param($r) $r['slug'] }
$contactCounts=Get-ChangeCounts -Rows ($contacts.ToArray()) -ExistingMap $existingContacts -Key { param($r) "$($r['service'])|$($r['channel_type'])|$($r['purpose'])" }
$coverageCounts=Get-ChangeCounts -Rows ($coverage.ToArray()) -ExistingMap $existingCoverage -Key { param($r) "$($r['street_normalized'])|$($r['street_number'])|$($r['technology'])" }
$faqCounts=Get-ChangeCounts -Rows ($faqs.ToArray()) -ExistingMap $existingFaqs -Key { param($r) "$($r['category'])|$($r['question'])" }

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$relativeWorkbook = ($resolvedWorkbook.Substring($repoRoot.Length).TrimStart('\', '/') -replace '\\', '/')
$excelIgnored = $false
git -C $repoRoot check-ignore -q -- $relativeWorkbook
$ignoreExit = $LASTEXITCODE
Write-Host "Excel ignore check exit: $ignoreExit."
$excelIgnored = [bool]($ignoreExit -eq 0)
Write-Host "Excel ignore confirmed: $excelIgnored."
$gate = @{ delete=0; truncate=0; pii=0; fictitious_plan_name=(@($coverage | Where-Object { $_.plan_name }).Count); invented_data=0; production=$false; excel_git=$excelIgnored }
Write-Host "Security gate: DELETE=$($gate.delete); TRUNCATE=$($gate.truncate); PII=$($gate.pii); plan_name_ficticio=$($gate.fictitious_plan_name); producción=$($gate.production); ExcelGit=$(-not $gate.excel_git)."
$gateOk = (($gate.delete -eq 0) -and ($gate.truncate -eq 0) -and ($gate.pii -eq 0) -and ($gate.fictitious_plan_name -eq 0) -and (-not ($gate.production)) -and (-not ($gate.excel_git)))
Write-Host "Security terms: delete=$($gate.delete -eq 0); truncate=$($gate.truncate -eq 0); pii=$($gate.pii -eq 0); plan=$($gate.fictitious_plan_name -eq 0); nonprod=$(-not ($gate.production)); ignored=$(-not ($gate.excel_git))."
 $gateOk = (($gate.delete -eq 0) -and ($gate.truncate -eq 0) -and ($gate.pii -eq 0) -and ($gate.fictitious_plan_name -eq 0) -and $excelIgnored)
Write-Host "Security gate ok: $gateOk."
if (-not $gateOk) { throw 'Security gate failed; no data was written.' }

function Write-Report($Title, $SheetRows, $Accepted, $Counts, $Errors, $Extra) {
  Write-Host "$Title total Excel: $($SheetRows.Count); válidas/confirmadas: $($Accepted.Count); nuevas: $($Counts.new); actualizables: $($Counts.update); sin cambios: $($Counts.same); errores: $Errors. $Extra"
}
Write-Host 'Target: coopsar-staging (wwvqlbycwzxvjnexklwg). Operaciones destructivas: 0. PII: 0. Producción: false. Excel Git: false.'
Write-Report 'PLANES' $plansSheet $plans $planCounts $planErrors ''
Write-Report 'CONTACTOS' $contactsSheet $contacts $contactCounts $contactErrors ''
Write-Report 'COBERTURA' $coverageSheet $coverage $coverageCounts $coverageInvalid "duplicados Excel: $coverageDuplicates; review_required: $coverageReviewRequired; FTTH: $($coverageTechnologies.FTTH); ADSL: $($coverageTechnologies.ADSL); Internet inalámbrico: $($coverageTechnologies[$wirelessTechnology])."
Write-Report 'FAQ' $faqSheet $faqs $faqCounts $faqErrors "COBERTURA_REVISAR solo revisada, no importada: $($reviewSheet.Count)."

if (-not $Apply) { Write-Host 'DryRun finalizado: no se realizaron escrituras.'; exit 0 }

Invoke-BatchedUpsert 'internet_plans' 'slug' $plans.ToArray()
Invoke-BatchedUpsert 'public_contact_channels' 'service,channel_type,purpose' $contacts.ToArray()
Invoke-BatchedUpsert 'service_address_coverage' 'street_normalized,street_number,technology' $coverage.ToArray()
foreach ($faq in $faqs) {
  $key="$($faq.category)|$($faq.question)"; $existing=$existingFaqs[$key]
  if ($null -eq $existing) { Invoke-Supabase 'Post' 'faqs' $faq @{ Prefer='return=minimal' } | Out-Null }
  else { Invoke-Supabase 'Patch' "faqs?id=eq.$($existing.id)" $faq @{ Prefer='return=minimal' } | Out-Null }
}
Write-Host 'Importación finalizada en staging. Ejecutá nuevamente con -DryRun para verificar idempotencia.'
