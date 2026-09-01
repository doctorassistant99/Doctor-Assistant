"""initial schema migration

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    user_role = postgresql.ENUM("ADMIN", "CASHIER", name="userrole")
    user_role.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="CASHIER"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("idx_users_email", "users", ["email"])
    op.create_index("idx_users_role", "users", ["role"])
    op.create_index("idx_users_is_active", "users", ["is_active"])

    op.create_table(
        "patients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("gender", sa.String(20), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("total_visits", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("idx_patients_full_name", "patients", ["full_name"])
    op.create_index("idx_patients_phone", "patients", ["phone"])

    appointment_status = postgresql.ENUM(
        "SCHEDULED", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW",
        name="appointmentstatus",
    )
    appointment_status.create(op.get_bind(), checkfirst=True)
    booking_source = postgresql.ENUM("ONLINE", "RECEPTION", "PHONE", "MANUAL", name="bookingsource")
    booking_source.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "appointments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id", ondelete="CASCADE"), nullable=False),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("appointment_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("status", appointment_status, nullable=False, server_default="SCHEDULED"),
        sa.Column("service", sa.String(255), nullable=True),
        sa.Column("booking_source", booking_source, nullable=False, server_default="MANUAL"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.UniqueConstraint("doctor_id", "appointment_date", "start_time", name="uq_doctor_date_start"),
    )
    op.create_index("idx_appointments_patient_id", "appointments", ["patient_id"])
    op.create_index("idx_appointments_doctor_id", "appointments", ["doctor_id"])
    op.create_index("idx_appointments_date", "appointments", ["appointment_date"])
    op.create_index("idx_appointments_status", "appointments", ["status"])

    op.create_table(
        "visits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id", ondelete="CASCADE"), nullable=False),
        sa.Column("appointment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True, unique=True),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("visit_date", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("symptoms", sa.Text(), nullable=True),
        sa.Column("diagnosis", sa.Text(), nullable=True),
        sa.Column("treatment", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("idx_visits_patient_id", "visits", ["patient_id"])

    payment_method = postgresql.ENUM("CASH", "CARD", "TRANSFER", "OTHER", name="paymentmethod")
    payment_method.create(op.get_bind(), checkfirst=True)
    transaction_type = postgresql.ENUM("CONSULTATION", "PAYMENT", "REFUND", "OTHER", name="transactiontype")
    transaction_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("invoice_number", sa.String(50), nullable=False, unique=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id", ondelete="CASCADE"), nullable=False),
        sa.Column("visit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("visits.id", ondelete="SET NULL"), nullable=True),
        sa.Column("transaction_type", transaction_type, nullable=False),
        sa.Column("payment_method", payment_method, nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    )
    op.create_index("idx_transactions_invoice", "transactions", ["invoice_number"])
    op.create_index("idx_transactions_patient_id", "transactions", ["patient_id"])
    op.create_index("idx_transactions_created_at", "transactions", ["created_at"])
    op.create_index("idx_transactions_created_by", "transactions", ["created_by"])

    op.create_table(
        "clinic_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("doctor_name", sa.String(255), nullable=True),
        sa.Column("clinic_name", sa.String(255), nullable=True),
        sa.Column("logo_url", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("booking_enabled", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("working_hours", postgresql.JSONB(), nullable=True),
        sa.Column("appointment_duration_minutes", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("invoice_prefix", sa.String(20), nullable=True),
        sa.Column("invoice_format", sa.String(100), nullable=True, server_default="YYMMDD0001"),
        sa.Column("extra_config", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.execute("""
    CREATE OR REPLACE FUNCTION generate_invoice_number()
    RETURNS TRIGGER AS $$
    DECLARE
        today_str TEXT;
        seq_num INTEGER;
    BEGIN
        PERFORM pg_advisory_xact_lock(hashtext('invoice_number_generator'));
        today_str := to_char(NOW(), 'YYMMDD');
        SELECT COALESCE(MAX(CAST(RIGHT(invoice_number, 4) AS INTEGER)), 0) + 1
        INTO seq_num
        FROM transactions
        WHERE invoice_number LIKE today_str || '%';
        NEW.invoice_number := today_str || LPAD(seq_num::TEXT, 4, '0');
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    CREATE TRIGGER trg_generate_invoice_number
        BEFORE INSERT ON transactions
        FOR EACH ROW
        WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
        EXECUTE FUNCTION generate_invoice_number();
    """)

    op.execute("""
    CREATE OR REPLACE FUNCTION update_patient_visit_count()
    RETURNS TRIGGER AS $$
    BEGIN
        UPDATE patients
        SET total_visits = (SELECT COUNT(*) FROM visits WHERE patient_id = NEW.patient_id),
        updated_at = NOW()
        WHERE id = NEW.patient_id;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    CREATE TRIGGER trg_update_patient_visit_count
        AFTER INSERT ON visits
        FOR EACH ROW
        EXECUTE FUNCTION update_patient_visit_count();
    """)


def downgrade() -> None:
    op.drop_table("clinic_settings")
    op.drop_table("transactions")
    op.drop_table("visits")
    op.drop_table("appointments")
    op.drop_table("patients")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS transactiontype")
    op.execute("DROP TYPE IF EXISTS paymentmethod")
    op.execute("DROP TYPE IF EXISTS bookingsource")
    op.execute("DROP TYPE IF EXISTS appointmentstatus")
    op.execute("DROP TYPE IF EXISTS userrole")
