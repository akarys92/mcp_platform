-- Add "apollo" to the connectors type check constraint
ALTER TABLE connectors DROP CONSTRAINT connectors_type_check;
ALTER TABLE connectors ADD CONSTRAINT connectors_type_check
  CHECK (type IN ('quickbooks', 'stardex', 'apollo', 'justworks', 'docusign', 'gdrive'));
