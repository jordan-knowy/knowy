-- Fusion de contacts par nom (homonymes / multi-emails)
-- Lien réversible + emails secondaires pour les futures synchros Gmail

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS merged_into_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS secondary_emails text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_contacts_merged_into
  ON contacts(merged_into_contact_id) WHERE merged_into_contact_id IS NOT NULL;

-- Fusionne le contact secondaire dans le primaire (re-pointe échanges + réunions)
CREATE OR REPLACE FUNCTION public.merge_contacts(primary_id uuid, secondary_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_secondary_email text;
BEGIN
  SELECT organization_id, email INTO v_org, v_secondary_email FROM contacts WHERE id = secondary_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Secondary contact not found'; END IF;
  IF NOT private.is_org_member(v_org) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF primary_id = secondary_id THEN RAISE EXCEPTION 'Cannot merge a contact with itself'; END IF;

  UPDATE communication_messages SET contact_id = primary_id WHERE contact_id = secondary_id;
  UPDATE meeting_participants SET contact_id = primary_id WHERE contact_id = secondary_id;
  UPDATE behavioral_signals SET contact_id = primary_id WHERE contact_id = secondary_id;

  IF v_secondary_email IS NOT NULL THEN
    UPDATE contacts
    SET secondary_emails = (
      SELECT array_agg(DISTINCT e)
      FROM unnest(coalesce(secondary_emails, '{}') || ARRAY[v_secondary_email]) e
      WHERE e IS NOT NULL AND e <> contacts.email
    )
    WHERE id = primary_id;
  END IF;

  UPDATE contacts
  SET merged_into_contact_id = primary_id, enrichment_status = 'merged', updated_at = now()
  WHERE id = secondary_id;
END;
$$;

-- Annule une fusion
CREATE OR REPLACE FUNCTION public.unmerge_contact(secondary_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
BEGIN
  SELECT organization_id INTO v_org FROM contacts WHERE id = secondary_id;
  IF v_org IS NULL OR NOT private.is_org_member(v_org) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE contacts SET merged_into_contact_id = NULL, enrichment_status = 'pending', updated_at = now()
  WHERE id = secondary_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.merge_contacts(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.unmerge_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merge_contacts(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unmerge_contact(uuid) TO authenticated;
