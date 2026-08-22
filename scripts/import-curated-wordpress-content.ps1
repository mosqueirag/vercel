[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)][string]$InputPath = "",
  [switch]$Apply,
  [switch]$DryRun,
  [switch]$SelfTest
)

$ErrorActionPreference = "Stop"
$StagingUrl = "https://wwvqlbycwzxvjnexklwg.supabase.co"
$UserAgent = "COOPSAR-Curated-Content-Importer/2.0"

function Get-Sha256([string]$Value) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($Value))) -replace "-", "").ToLowerInvariant() }
  finally { $sha.Dispose() }
}
function New-ImportKey([string]$Type, [string]$NaturalKey) { return "wordpress:${Type}:" + (Get-Sha256 $NaturalKey) }
function ConvertTo-Slug([string]$Value) {
  $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
  $withoutMarks = -join @($normalized.ToCharArray() | Where-Object { [Globalization.CharUnicodeInfo]::GetUnicodeCategory($_) -ne [Globalization.UnicodeCategory]::NonSpacingMark })
  return (($withoutMarks.ToLowerInvariant() -replace '[^a-z0-9]+', '-') -replace '(^-|-$)', '')
}
function Get-Payload([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { throw "Import blocked: input package was not found." }
  if ([IO.Path]::GetExtension($Path).ToLowerInvariant() -ne ".zip") { return Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json }
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $archive = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Path))
  try {
    $entry = $archive.GetEntry("curated/IMPORT_PAYLOAD_COMPLETE.json")
    if ($null -eq $entry) { throw "Import blocked: ZIP has no curated/IMPORT_PAYLOAD_COMPLETE.json." }
    $reader = [IO.StreamReader]::new($entry.Open())
    try { return $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
  } finally { $archive.Dispose() }
}
function Assert-Payload($Payload) {
  $required = @("services", "help_articles", "faqs", "internet_plans_draft", "contact_channels_draft", "validation_queue", "content_provenance", "source_pages_cleaned", "coopia_knowledge_manifest")
  $missing = @($required | Where-Object { $null -eq $Payload.$_ })
  if ($missing.Count) { throw "Import blocked: missing sections: $($missing -join ', ')." }
  if ($null -ne $Payload.coverage_zones) { throw "Import blocked: coverage_zones are never accepted from WordPress." }
  $sources = @{}; foreach ($page in @($Payload.source_pages_cleaned)) {
    if ([string]::IsNullOrWhiteSpace($page.slug) -or [string]::IsNullOrWhiteSpace($page.source_url) -or [string]::IsNullOrWhiteSpace($page.source_modified_at) -or [string]::IsNullOrWhiteSpace($page.migration_decision) -or $page.raw_content_sha256 -notmatch '^[a-f0-9]{64}$') { throw "Import blocked: source_pages_cleaned contains incomplete evidence." }
    if ($sources.ContainsKey($page.slug)) { throw "Import blocked: duplicate source page slug." }; $sources[$page.slug] = $page
  }
  if ($sources.Count -ne 63) { throw "Import blocked: expected 63 source pages." }
  foreach ($item in @($Payload.services + $Payload.help_articles + $Payload.faqs + $Payload.internet_plans_draft)) {
    if ($item.status -ne "draft" -or $null -ne $item.published_at) { throw "Import blocked: all curated content must remain draft with published_at=null." }
  }
  $serviceSlugs = @($Payload.services | ForEach-Object slug)
  foreach ($item in @($Payload.help_articles + $Payload.faqs + $Payload.internet_plans_draft)) { if ($serviceSlugs -notcontains $item.service_slug) { throw "Import blocked: an item references a missing service_slug." } }
  if (@($Payload.content_provenance).Count -ne 72) { throw "Import blocked: expected 72 provenance entities." }
  $edges = 0; foreach ($provenance in @($Payload.content_provenance)) { foreach ($source in @($provenance.sources)) { $edges++; if (-not $sources.ContainsKey($source.slug) -or $source.raw_content_sha256 -notmatch '^[a-f0-9]{64}$') { throw "Import blocked: provenance references unknown or invalid source evidence." } } }
  if ($edges -ne 156) { throw "Import blocked: expected 156 provenance relations." }
  if (@($Payload.validation_queue).Count -ne 10) { throw "Import blocked: expected 10 validation-queue items." }
  foreach ($queueItem in @($Payload.validation_queue)) {
    if ($queueItem.priority -notin @('P0', 'P1', 'P2', 'P3') -or [string]::IsNullOrWhiteSpace($queueItem.item) -or [string]::IsNullOrWhiteSpace($queueItem.reason) -or @($queueItem.source_slugs).Count -eq 0) { throw "Import blocked: validation queue contains an invalid item." }
  }
}
function Get-Headers {
  if ([string]::IsNullOrWhiteSpace($env:SUPABASE_SECRET_KEY)) { throw "SUPABASE_SECRET_KEY is required for remote dry-run or apply." }
  return @{ apikey = $env:SUPABASE_SECRET_KEY; "User-Agent" = $UserAgent; Prefer = "resolution=merge-duplicates,return=representation" }
}
function ConvertTo-SupabaseJson($Body) {
  # -InputObject preserves an array as one JSON document. Piping an array can
  # serialize each member independently, which PostgREST rejects as PGRST102.
  return ConvertTo-Json -InputObject $Body -Depth 20 -Compress
}
function Build-SupabasePath([string]$Table, [string]$Conflict) {
  if ([string]::IsNullOrWhiteSpace($Table) -or [string]::IsNullOrWhiteSpace($Conflict)) { throw "Table and conflict field are required." }
  return "${Table}?on_conflict=${Conflict}"
}
function Invoke-Supabase([string]$Path, [string]$Method = "GET", $Body = $null) {
  $params = @{ Uri = "${StagingUrl}/rest/v1/${Path}"; Method = $Method; Headers = (Get-Headers); ContentType = "application/json" }
  if ($null -ne $Body) {
    $json = ConvertTo-SupabaseJson $Body
    $params.Body = [Text.Encoding]::UTF8.GetBytes($json)
    $params.ContentType = "application/json; charset=utf-8"
  }
  return Invoke-RestMethod @params
}
function Get-AllRows([string]$Path) {
  $rows = @(); $offset = 0
  do { $page = @(Invoke-Supabase "${Path}&offset=${offset}&limit=1000"); $rows += $page; $offset += $page.Count } while ($page.Count -eq 1000)
  return $rows
}
function Get-ServiceName([string]$Domain) {
  $map = @{ "cobranzas" = "billing"; "energia" = "energy"; "general" = "general"; "internet-telefonia" = "phone"; "sepelio" = "funeral"; "tramites" = "general" }
  if (-not $map.ContainsKey($Domain)) { throw "Import blocked: unsupported historical contact domain." }; return $map[$Domain]
}
function Get-ProvenanceRows($Payload, [string]$Type, [string]$Key, [string]$EntityId, [string]$Outcome) {
  $entry = @($Payload.content_provenance | Where-Object { $_.entity_type -eq $Type -and $_.entity_key -eq $Key }) | Select-Object -First 1
  if ($null -eq $entry) { throw "Import blocked: provenance missing for $Type/$Key." }
  return @($entry.sources | ForEach-Object { [ordered]@{ entity_type=$Type; entity_id=if ($EntityId) { $EntityId } else { $null }; entity_key=$Key; source_system="wordpress"; source_slug=$_.slug; source_url=$_.source_url; source_title=$null; source_modified_at=$_.source_modified_at; migration_decision=$_.migration_decision; raw_content_sha256=$_.raw_content_sha256; import_outcome=$Outcome } })
}
function Get-ProvenanceKey([string]$Type, $Item, [int]$Index = 0) {
  switch ($Type) {
    "faq" { return "faq-" + (ConvertTo-Slug $Item.question) }
    "contact_channel" { return "contact-{0:d2}-{1}-{2}" -f ($Index + 1), $Item.domain, ($Item.channel -replace '_', '-') }
    "coopia_knowledge" { return $Item.intent }
    default { return $Item.slug }
  }
}
function Get-ExistingByField($Rows, [string]$Field) {
  $map = @{}
  foreach ($row in @($Rows)) { if ($null -ne $row.$Field) { $map[[string]$row.$Field] = $row } }
  return $map
}
function Add-ImportSummary($Summary, $Rows, $ExistingByKey, [string]$Field) {
  foreach ($row in @($Rows)) {
    $key = [string]$row.$Field
    if (-not $ExistingByKey.ContainsKey($key)) { $Summary.new++; continue }
    if ($ExistingByKey[$key].status -eq "published") { $Summary.conflicts++; continue }
    $Summary.unchanged++
  }
}
function Get-ImportCounts($Rows, $ExistingByKey, [string]$Field) {
  $counts = [ordered]@{ new=0; updated=0; same=0; conflicts=0 }
  foreach ($row in @($Rows)) {
    $key = [string]$row.$Field
    if (-not $ExistingByKey.ContainsKey($key)) { $counts.new++; continue }
    if ($ExistingByKey[$key].status -eq 'published') { $counts.conflicts++; continue }
    $counts.same++
  }
  return $counts
}
function Invoke-SelfTest {
  if ((New-ImportKey "faq" "pregunta") -notmatch '^wordpress:faq:[a-f0-9]{64}$') { throw "SelfTest failed: import key." }
  if ((Get-ServiceName "internet-telefonia") -ne "phone") { throw "SelfTest failed: contact domain mapping." }
  $headers = @{ apikey = "sb_secret_test"; "User-Agent" = $UserAgent }
  if ($headers.ContainsKey("Authorization") -or $headers["User-Agent"] -notmatch '^COOPSAR-') { throw "SelfTest failed: server headers." }
  if ((ConvertTo-Slug "Que puedo revisar si no tengo Wi-Fi") -ne "que-puedo-revisar-si-no-tengo-wi-fi") { throw "SelfTest failed: provenance FAQ slug." }
  if ((Get-ProvenanceKey "contact_channel" ([pscustomobject]@{ domain="energia"; channel="guard_phone" }) 4) -ne "contact-05-energia-guard-phone") { throw "SelfTest failed: provenance contact key." }
  $batch63 = @(1..63 | ForEach-Object { [ordered]@{ id=$_; label="Página española ñ $_"; optional=$null } })
  $batch9 = @(1..9 | ForEach-Object { [ordered]@{ id=$_ } })
  $json63 = ConvertTo-SupabaseJson $batch63
  $json9 = ConvertTo-SupabaseJson $batch9
  $singleJson = ConvertTo-SupabaseJson ([ordered]@{ title="Información ñ"; optional=$null })
  $null = $json63 | ConvertFrom-Json
  $null = $json9 | ConvertFrom-Json
  $parsedSingle = $singleJson | ConvertFrom-Json
  if ((-not $json63.StartsWith('[')) -or (([regex]::Matches($json63, '"id":')).Count -ne 63) -or ($json63 -notmatch '"optional":null')) { throw "SelfTest failed: 63-row batch JSON." }
  if ((-not $json9.StartsWith('[')) -or (([regex]::Matches($json9, '"id":')).Count -ne 9)) { throw "SelfTest failed: 9-row batch JSON." }
  if (($singleJson.StartsWith('[')) -or ($parsedSingle.title -ne "Información ñ") -or ($singleJson -notmatch '"optional":null')) { throw "SelfTest failed: single-row JSON." }
  if ([Text.Encoding]::UTF8.GetString([Text.Encoding]::UTF8.GetBytes($singleJson)) -ne $singleJson) { throw "SelfTest failed: UTF-8 serialization." }
  $expectedPaths = @{
    services = 'services?on_conflict=slug'
    faqs = 'faqs?on_conflict=import_key'
    public_contact_channels = 'public_contact_channels?on_conflict=import_key'
  }
  foreach ($table in $expectedPaths.Keys) {
    $conflict = if ($table -eq 'services') { 'slug' } else { 'import_key' }
    $path = Build-SupabasePath $table $conflict
    if ($path -ne $expectedPaths[$table] -or $path -match '/|=slug$' -and $path -ne 'services?on_conflict=slug') { throw "SelfTest failed: PostgREST upsert path." }
  }
  Write-Output "SELF_TEST=PASS"
}

if ($SelfTest) { Invoke-SelfTest; exit 0 }
if ($Apply -and $DryRun) { throw "Choose either -Apply or -DryRun." }
if ([string]::IsNullOrWhiteSpace($InputPath)) { throw "InputPath is required and must point to the private ZIP or payload." }
if ($env:NEXT_PUBLIC_SUPABASE_URL -ne $StagingUrl) { throw "Import blocked: NEXT_PUBLIC_SUPABASE_URL must equal the authorized staging URL." }
$payload = Get-Payload $InputPath; Assert-Payload $payload

$sourceRows = @($payload.source_pages_cleaned | ForEach-Object { [ordered]@{ source_system="wordpress"; source_slug=$_.slug; source_url=$_.source_url; source_title=$_.title; source_post_date=$_.source_post_date; source_modified_at=$_.source_modified_at; wordpress_status=$_.wordpress_status; migration_decision=$_.migration_decision; decision_reason=$_.decision_reason; raw_content_sha256=$_.raw_content_sha256 } })
$existing = @{ services=@(Get-AllRows "services?select=id,slug,status"); articles=@(Get-AllRows "help_articles?select=id,slug,status"); plans=@(Get-AllRows "internet_plans?select=id,slug,status"); contacts=@(Get-AllRows "public_contact_channels?select=id,import_key,status"); faqs=@(Get-AllRows "faqs?select=id,import_key,status"); sources=@(Get-AllRows "content_import_source_pages?select=source_slug"); provenance=@(Get-AllRows "content_import_provenance?select=entity_type,entity_key,source_slug"); validation_queue=@(Get-AllRows "content_import_validation_queue?select=validation_key") }
$summary = [ordered]@{ new=0; updated=0; unchanged=0; skipped=0; conflicts=0; services=@($payload.services).Count; help_articles=@($payload.help_articles).Count; faqs=@($payload.faqs).Count; internet_plans=@($payload.internet_plans_draft).Count; contacts=@($payload.contact_channels_draft).Count; validation_queue=@($payload.validation_queue).Count; source_pages=@($payload.source_pages_cleaned).Count; provenance_entities=@($payload.content_provenance).Count; provenance_relations=156; coverage_zones=0; mode=if($Apply){"apply"}else{"dry-run"} }
$serviceBySlug = Get-ExistingByField $existing.services 'slug'
$articleBySlug = Get-ExistingByField $existing.articles 'slug'
$planBySlug = Get-ExistingByField $existing.plans 'slug'
$faqByKey = Get-ExistingByField $existing.faqs 'import_key'
$contactByKey = Get-ExistingByField $existing.contacts 'import_key'
$sourceBySlug = Get-ExistingByField $existing.sources 'source_slug'
$validationByKey = Get-ExistingByField $existing.validation_queue 'validation_key'
$serviceCandidate = @($payload.services | ForEach-Object { [ordered]@{ slug=$_.slug; name=$_.name; description=$_.description; status='draft'; sort_order=[int]$_.sort_order } })
$articleCandidate = @($payload.help_articles | ForEach-Object { [ordered]@{ slug=$_.slug; service_slug=$_.service_slug; title=$_.title; category=$_.category; summary=$_.summary; content=$_.content; status='draft'; published_at=$null } })
$planCandidate = @($payload.internet_plans_draft | ForEach-Object { [ordered]@{ slug=$_.slug; service_slug=$_.service_slug; name=$_.name; audience=$_.audience; speed_down_mbps=$_.speed_down_mbps; speed_up_mbps=$_.speed_up_mbps; technology=$_.technology; price_amount=$_.price_amount; currency=$_.currency; benefits=@($_.benefits); installation_notes=$_.installation_notes; status='draft'; sort_order=[int]$_.sort_order; published_at=$null } })
$faqCandidate = @($payload.faqs | ForEach-Object { $provenanceKey=Get-ProvenanceKey 'faq' $_; [ordered]@{ provenance_key=$provenanceKey; import_key=(New-ImportKey 'faq' $provenanceKey); service_slug=$_.service_slug; question=$_.question; answer=$_.answer; category=$_.category; status='draft'; sort_order=[int]$_.sort_order; published_at=$null } })
$contactCandidate = @($payload.contact_channels_draft | ForEach-Object -Begin { $position=0 } -Process { $provenanceKey=Get-ProvenanceKey 'contact_channel' $_ $position; $position++; [ordered]@{ provenance_key=$provenanceKey; import_key=(New-ImportKey 'contact_channel' $provenanceKey); service=(Get-ServiceName $_.domain); channel_type=$_.channel; label='Canal histórico pendiente de validación'; value=$_.value; public_value=$_.value; purpose=('historical-' + (Get-Sha256 $provenanceKey).Substring(0,16)); status='draft'; sort_order=0; published_at=$null } })
$validationCandidate = @($payload.validation_queue | ForEach-Object { [ordered]@{ validation_key=(New-ImportKey 'validation' "$($_.priority)|$($_.item)"); priority=$_.priority; item=$_.item; reason=$_.reason; source_slugs=@($_.source_slugs); status='open' } })
Add-ImportSummary $summary $serviceCandidate $serviceBySlug 'slug'; Add-ImportSummary $summary $articleCandidate $articleBySlug 'slug'; Add-ImportSummary $summary $planCandidate $planBySlug 'slug'; Add-ImportSummary $summary $faqCandidate $faqByKey 'import_key'; Add-ImportSummary $summary $contactCandidate $contactByKey 'import_key'; Add-ImportSummary $summary $validationCandidate $validationByKey 'validation_key'
foreach ($row in $sourceRows) { if ($sourceBySlug.ContainsKey($row.source_slug)) { $summary.unchanged++ } else { $summary.new++ } }
$sourceCounts = Get-ImportCounts $sourceRows $sourceBySlug 'source_slug'
$summary.sections = [ordered]@{
  services = Get-ImportCounts $serviceCandidate $serviceBySlug 'slug'
  help_articles = Get-ImportCounts $articleCandidate $articleBySlug 'slug'
  faqs = Get-ImportCounts $faqCandidate $faqByKey 'import_key'
  internet_plans = Get-ImportCounts $planCandidate $planBySlug 'slug'
  contact_candidates = Get-ImportCounts $contactCandidate $contactByKey 'import_key'
  validation_queue = Get-ImportCounts $validationCandidate $validationByKey 'validation_key'
  source_pages = $sourceCounts
  provenance = [ordered]@{ new=[Math]::Max(0, (156 - @($existing.provenance).Count)); updated=0; same=[Math]::Min(156, @($existing.provenance).Count); conflicts=0 }
}
if (-not $Apply) { Write-Output ("DRY_RUN=" + ($summary | ConvertTo-Json -Depth 8 -Compress)); Write-Output "Dry run only. No writes were made."; exit 0 }

function Save-NewRows([string]$Table, [string]$Conflict, $Rows, $ExistingByKey, [string]$Field) {
  $newRows = @($Rows | Where-Object { -not $ExistingByKey.ContainsKey([string]$_.$Field) })
  if (-not $newRows.Count) { return @() }
  return @(Invoke-Supabase (Build-SupabasePath $Table $Conflict) "POST" $newRows)
}
$sourceRowsToSave = @($sourceRows | Where-Object { -not $sourceBySlug.ContainsKey($_.source_slug) })
if ($sourceRowsToSave.Count -gt 0) { Invoke-Supabase "content_import_source_pages?on_conflict=source_system,source_slug" "POST" $sourceRowsToSave | Out-Null }
$savedServices = Save-NewRows 'services' 'slug' $serviceCandidate $serviceBySlug 'slug'
foreach ($row in $savedServices) { $serviceBySlug[$row.slug] = $row }
$serviceIds=@{}; foreach($slug in $serviceBySlug.Keys) { $serviceIds[$slug]=$serviceBySlug[$slug].id }
$articlesToSave = @($articleCandidate | Where-Object { $serviceIds.ContainsKey($_.service_slug) } | ForEach-Object { [ordered]@{ service_id=$serviceIds[$_.service_slug]; slug=$_.slug; title=$_.title; category=$_.category; summary=$_.summary; content=$_.content; status='draft'; published_at=$null } })
$plansToSave = @($planCandidate | Where-Object { $serviceIds.ContainsKey($_.service_slug) } | ForEach-Object { [ordered]@{ service_id=$serviceIds[$_.service_slug]; slug=$_.slug; name=$_.name; audience=$_.audience; speed_down_mbps=$_.speed_down_mbps; speed_up_mbps=$_.speed_up_mbps; technology=$_.technology; price_amount=$_.price_amount; currency=$_.currency; benefits=$_.benefits; installation_notes=$_.installation_notes; status='draft'; sort_order=$_.sort_order; published_at=$null } })
$faqsToSave = @($faqCandidate | Where-Object { $serviceIds.ContainsKey($_.service_slug) } | ForEach-Object { [ordered]@{ service_id=$serviceIds[$_.service_slug]; question=$_.question; answer=$_.answer; category=$_.category; status='draft'; sort_order=$_.sort_order; published_at=$null; import_key=$_.import_key } })
$contactsToSave = @($contactCandidate | ForEach-Object { [ordered]@{ service=$_.service; channel_type=$_.channel_type; label=$_.label; value=$_.value; public_value=$_.public_value; purpose=$_.purpose; status='draft'; sort_order=0; published_at=$null; import_key=$_.import_key } })
$savedArticles = Save-NewRows 'help_articles' 'slug' $articlesToSave $articleBySlug 'slug'
$savedPlans = Save-NewRows 'internet_plans' 'slug' $plansToSave $planBySlug 'slug'
$savedFaqs = Save-NewRows 'faqs' 'import_key' $faqsToSave $faqByKey 'import_key'
$savedContacts = Save-NewRows 'public_contact_channels' 'import_key' $contactsToSave $contactByKey 'import_key'
$savedValidation = Save-NewRows 'content_import_validation_queue' 'validation_key' $validationCandidate $validationByKey 'validation_key'
$articleBySlug = Get-ExistingByField (@($existing.articles + $savedArticles)) 'slug'; $planBySlug = Get-ExistingByField (@($existing.plans + $savedPlans)) 'slug'; $faqByKey = Get-ExistingByField (@($existing.faqs + $savedFaqs)) 'import_key'; $contactByKey = Get-ExistingByField (@($existing.contacts + $savedContacts)) 'import_key'
$provenance=@(); foreach($item in $serviceCandidate){$row=$serviceBySlug[$item.slug];$outcome=if($existing.services.slug -contains $item.slug){'unchanged'}else{'imported'};$provenance += Get-ProvenanceRows $payload 'service' $item.slug $row.id $outcome}; foreach($item in $articleCandidate){$row=$articleBySlug[$item.slug];if($row){$outcome=if($existing.articles.slug -contains $item.slug){'unchanged'}else{'imported'};$provenance += Get-ProvenanceRows $payload 'help_article' $item.slug $row.id $outcome}}; foreach($item in $faqCandidate){$row=$faqByKey[$item.import_key];if($row){$outcome=if($existing.faqs.import_key -contains $item.import_key){'unchanged'}else{'imported'};$provenance += Get-ProvenanceRows $payload 'faq' $item.provenance_key $row.id $outcome}}; foreach($item in $planCandidate){$row=$planBySlug[$item.slug];if($row){$outcome=if($existing.plans.slug -contains $item.slug){'unchanged'}else{'imported'};$provenance += Get-ProvenanceRows $payload 'internet_plan' $item.slug $row.id $outcome}}; foreach($item in $contactCandidate){$row=$contactByKey[$item.import_key];if($row){$outcome=if($existing.contacts.import_key -contains $item.import_key){'unchanged'}else{'imported'};$provenance += Get-ProvenanceRows $payload 'contact_channel' $item.provenance_key $row.id $outcome}}; foreach($item in @($payload.coopia_knowledge_manifest)){ $key=Get-ProvenanceKey 'coopia_knowledge' $item; $provenance += Get-ProvenanceRows $payload 'coopia_knowledge' $key $null 'unchanged' }
$existingProvenance = @{}; foreach($row in $existing.provenance) { $existingProvenance["$($row.entity_type)|$($row.entity_key)|$($row.source_slug)"]=$true }
$newProvenance = @($provenance | Where-Object { -not $existingProvenance.ContainsKey("$($_.entity_type)|$($_.entity_key)|$($_.source_slug)") })
if ($newProvenance.Count) { Invoke-Supabase 'content_import_provenance?on_conflict=entity_type,entity_key,source_system,source_slug' 'POST' $newProvenance | Out-Null }
Write-Output ("APPLY_COMPLETE=" + ($summary | ConvertTo-Json -Compress)); Write-Output "All imported records remain draft with published_at=null. Coverage zones were not imported."
