-- Harden retained identity audit values and reset pre-change visitor sandboxes.
UPDATE demo_events
SET payload_json = CASE
  WHEN payload_json IS NULL THEN NULL
  WHEN json_valid(payload_json) THEN json_remove(payload_json, '$.subjectSha256', '$.namespace')
  ELSE NULL
END
WHERE demo_id = 'identity';

UPDATE application_logs
SET detail_json = CASE
  WHEN detail_json IS NULL THEN NULL
  WHEN json_valid(detail_json) THEN json_remove(detail_json, '$.subjectSha256', '$.namespace')
  ELSE NULL
END
WHERE source = 'identity';

DELETE FROM demo_records
WHERE namespace GLOB 'sandbox-*';
