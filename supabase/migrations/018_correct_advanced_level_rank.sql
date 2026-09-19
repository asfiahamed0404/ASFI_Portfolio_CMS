-- Keep the Advanced Level island rank concise in existing databases.
UPDATE education
SET details = array_replace(
  details,
  'Z-Score: +2.3250 | Island Rank: 424 / 35,197',
  'Z-Score: +2.3250 | Island Rank: 424'
)
WHERE title = 'G.C.E. Advanced Level'
  AND details @> ARRAY['Z-Score: +2.3250 | Island Rank: 424 / 35,197'];
