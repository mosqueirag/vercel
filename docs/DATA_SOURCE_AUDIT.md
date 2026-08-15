# Operational data source audit

Status: prepared locally on `platform-coopsar-ai`. No remote Supabase data has been written because there is no project that is unequivocally identified as COOPSAR STAGING.

`lib/coopsar-data.ts` remains a compatibility layer during the transition. It is not the intended source of truth for operational or commercial information.

## Migrate to Supabase

| Current element | Destination | Publication rule |
| --- | --- | --- |
| `CONTACT.whatsapp`, guards, office, hours and Oficina Virtual URL | `contact_channels` (new additive table) | Public only when `status = 'published'` and `published_at <= now()` |
| `internetPlans` | `internet_plans` | Only officially confirmed entries may be published; price, speed and technology stay `null` until confirmed |
| `serviceStatuses` | `service_alerts` through the canonical server-side selector | Only active, published alerts; absence resolves to `unknown` |
| General service descriptions | `services` | Published services only |
| Informational guidance in `knowledgeBase` | `faqs` and `help_articles` | Published, dated content only |

## Technical configuration that can remain in code

| Element | Reason |
| --- | --- |
| `ServiceStatus` union | Type-safe application contract for validated database values |
| Quick-action icon tokens and local route layout | Presentation/navigation configuration, not institutional content |
| Unknown-status and unavailable-data messages | Safe fallback behavior when the data source cannot be reached |

## Temporary fallbacks

| Element | Constraint |
| --- | --- |
| Current contact values in `CONTACT` | Retain only until the same confirmed channel is published in `contact_channels`; do not silently replace missing database data with commercial plan details |
| Empty-plan behavior | When no official published plan exists, show that pricing and availability require confirmation; never infer values |
| Service-status fallback | Return `unknown` and “Sin información operativa confirmada”; never assume service is operational |

## Existing schema to reuse

`services`, `help_articles`, `faqs`, `internet_plans`, `coverage_zones` and `service_alerts` are already defined by the additive migration `20260815143921_extend_digital_platform.sql`. Their RLS model exposes only published public knowledge and blocks private commercial records from browser roles.

`contact_channels` remains pending as the only missing content model. Its migration, RLS policies, seed data and corresponding server data-access layer must be prepared and applied only after an isolated staging project is confirmed.

## Source-of-truth transition

The target read path is `server data access layer -> Supabase -> typed tool -> COOPIA/UI`. Components must not make arbitrary Supabase queries. Until staging is validated, no operational data is considered migrated and no production source is modified.
