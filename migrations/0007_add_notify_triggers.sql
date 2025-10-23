-- Migration: Add NOTIFY triggers for real-time updates via PostgreSQL LISTEN/NOTIFY

-- 1. Create function to notify on duty_assignments changes
CREATE OR REPLACE FUNCTION notify_duty_assignments_changed()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('duty_assignments_changed', json_build_object(
        'id', NEW.id,
        'operation', TG_OP
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger for duty_assignments
DROP TRIGGER IF EXISTS duty_assignments_notify_trigger ON duty_assignments;
CREATE TRIGGER duty_assignments_notify_trigger
    AFTER INSERT OR UPDATE OR DELETE ON duty_assignments
    FOR EACH ROW EXECUTE FUNCTION notify_duty_assignments_changed();

-- 3. Create function to notify on documents changes
CREATE OR REPLACE FUNCTION notify_documents_changed()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('documents_changed', json_build_object(
        'id', COALESCE(NEW.id, OLD.id),
        'operation', TG_OP
    )::text);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for documents
DROP TRIGGER IF EXISTS documents_notify_trigger ON documents;
CREATE TRIGGER documents_notify_trigger
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION notify_documents_changed();

-- 5. Grant necessary permissions (if using specific database user)
-- GRANT EXECUTE ON FUNCTION notify_duty_assignments_changed() TO <your_db_user>;
-- GRANT EXECUTE ON FUNCTION notify_documents_changed() TO <your_db_user>;
