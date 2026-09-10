-- VerifyGate production seed data
-- Run this in the new prod Supabase project's SQL editor after the schema
-- (tables, RLS policies) has been applied.
--
-- Values marked CONFIRMED are real, taken directly from this project's code/copy.
-- Values marked TODO are placeholders — replace before going live, or the
-- related buttons/links on the public site will be broken or point nowhere.

insert into settings (key, value) values
  -- Pricing tiers — "Standard" monthly is CONFIRMED (matches the GH₵150 floor
  -- shown on /pricing and /get-started). The rest are the example numbers from
  -- the settings page placeholders (10x monthly = annual, per your own "2
  -- months free" formula) — confirm these are your real intended prices.
  ('tier_standard_monthly', '150'),
  ('tier_standard_annual', '1500'),
  ('tier_growth_monthly', '300'),
  ('tier_growth_annual', '3000'),
  ('tier_premier_monthly', '500'),
  ('tier_premier_annual', '5000'),
  ('tier_international_monthly', 'Custom'),
  ('tier_international_annual', 'Custom'),

  -- Contact — email is CONFIRMED (the hello@verifygate.app inbox set up via
  -- ImprovMX + Brevo). WhatsApp/phone are still the codebase's placeholder
  -- number and must be replaced with your real number, or every WhatsApp
  -- button site-wide links to a fake number.
  ('whatsapp', '233592637748'), -- CONFIRMED
  ('email', 'hello@verifygate.app'),
  ('phone', '+233 59 263 7748'), -- CONFIRMED

  -- Social links — none confirmed yet, leave blank to hide them (footer only
  -- renders a social link when its value is non-empty) or fill in real URLs.
  ('facebook', ''),
  ('instagram', ''),
  ('twitter', ''),
  ('linkedin', '')
on conflict (key) do update set value = excluded.value;
