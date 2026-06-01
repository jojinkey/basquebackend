# Supabase Schema Map (Verified via REST API)

## tables
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | text PK | - | "T1", "T2", etc. |
| section_id | uuid FK | - | → sections.id |
| capacity | int | - | Pax |
| status | text | 'available' | available, seated, reserved, needs_bussing |
| sort_order | int | - | Display order |
| is_active | bool | true | |
| current_session | uuid | null | → table_sessions.id |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | |

## sections (4 rows seeded)
| Column | Type |
|--------|------|
| id | uuid PK |
| name | text | "indoor", "terrace", "garden", "bar" |
| label | text | "Indoor", "Terrace", "Garden", "Bar" |
| sort_order | int |

## table_sessions (15 cols)
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid PK | gen_random_uuid() | |
| table_id | text FK NOT NULL | - | → tables.id |
| server_id | uuid FK | null | → users.id |
| guest_name | text | null | |
| covers | int | 1 | |
| is_vip | bool | false | |
| is_walk_in | bool | false | |
| reservation_id | uuid | null | |
| opened_at | timestamptz | now() | |
| closed_at | timestamptz | null | |
| is_active | bool | true | |
| total_paise | int | 0 | |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | null | |
| notes | text | null | |

## orders (10 cols)
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid PK | gen_random_uuid() | |
| session_id | uuid FK NOT NULL | - | → table_sessions.id |
| status | text/enum | 'placed' | pending_approval, placed, preparing, ready, served |
| subtotal | int | 0 | In paise or rupees |
| notes | text | null | |
| created_at | timestamptz | now() | |
| placed_at | timestamptz | null | |
| ready_at | timestamptz | null | |
| served_at | timestamptz | null | |
| updated_at | timestamptz | now() | |

## order_items (7 cols)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| order_id | uuid FK NOT NULL | → orders.id |
| menu_item_id | uuid FK | → menu_items.id |
| quantity | int | default 1 |
| unit_price | int | |
| notes | text | null |
| created_at | timestamptz | |

## menu_items (16 cols)
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid PK | | |
| category_id | uuid FK NOT NULL | | → menu_categories.id |
| name | text | | |
| description | text | null | |
| price | int | | In rupees |
| image_url | text | null | |
| dietary | text | 'veg' | veg, non_veg, egg |
| allergens | text | null | |
| is_available | bool | true | |
| is_featured | bool | false | |
| is_new | bool | false | |
| sort_order | int | | |
| prep_time_min | int | 15 | |
| created_at | timestamptz | | |
| updated_at | timestamptz | | |

*Note: 16th column unknown — likely an additional flag*

## menu_categories (5 cols, 6 rows)
| Column | Type |
|--------|------|
| id | uuid PK |
| name | text | slug key |
| label | text | Display name |
| sort_order | int |
| is_active | bool |

## service_requests (7 cols)
| Column | Type | Default |
|--------|------|---------|
| id | uuid PK | |
| table_id | text FK NOT NULL | → tables.id |
| table_name | text | |
| type | text | | call_waiter, bill_request |
| status | text | 'new' | new, acknowledged, completed |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## waitlist_entries (14 cols)
| Column | Type | Default |
|--------|------|---------|
| id | uuid PK | |
| guest_name | text NOT NULL | |
| guest_phone | text | null |
| party_size | int | 2 |
| source | text | 'walk_in' | walk_in, phone, website, host_stand |
| status | text | 'waiting' | waiting, notified, seated, declined |
| estimated_wait_min | int | null |
| priority | int | 0 |
| is_vip | bool | false |
| notes | text | null |
| created_at | timestamptz | |
| seated_at | timestamptz | null |
| declined_at | timestamptz | null |
| updated_at | timestamptz | |

## reservations (20 cols) — REALTIME ENABLED
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| type | text | table, event, golf, golf_dining |
| stage | text | new, reviewing, accepted, declined |
| name | text | |
| phone | text | |
| email | text | null |
| date | text | |
| time_slot | text | null |
| guests | int | |
| source_modal | text | TableBookingModal, EventEnquiryModal, etc. |
| details | jsonb | {space, budget, event_type, occasion, ...} |
| decline_reason | text | null |
| manager_notes | text | '' |
| handled_by | uuid | null |
| session_id | uuid | null |
| whatsapp_sent | bool | false |
| received_at | timestamptz | |
| responded_at | timestamptz | null |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## users (12 cols)
| Column | Type |
|--------|------|
| id | uuid PK |
| name | text |
| email | text |
| password_hash | text |
| pin | text | null |
| phone | text |
| role | text | owner, restaurant_manager, floor_manager, server, kitchen |
| section | text | null (assigned section for servers) |
| is_active | bool |
| joined_date | date |
| created_at | timestamptz |
| updated_at | timestamptz |

## audit_logs (8 cols)
| Column | Type |
|--------|------|
| id | uuid PK |
| action | text NOT NULL |
| entity | text |
| entity_id | text |
| user_id | uuid |
| details | jsonb |
| ip_address | text |
| created_at | timestamptz |

## shifts (7 cols)
| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK NOT NULL |
| started_at | timestamptz |
| ended_at | timestamptz |
| section | text |
| notes | text |
| created_at | timestamptz |

## reservation_stage_history (7 cols)
| Column | Type |
|--------|------|
| id | uuid PK |
| reservation_id | uuid FK NOT NULL |
| from_stage | text |
| to_stage | text |
| changed_by | uuid |
| notes | text |
| created_at | timestamptz |
