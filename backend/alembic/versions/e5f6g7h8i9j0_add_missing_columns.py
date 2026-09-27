"""add missing columns

Revision ID: e5f6g7h8i9j0
Revises: d4e5f6g7h8i9
Create Date: 2026-09-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e5f6g7h8i9j0'
down_revision = 'd4e5f6g7h8i9'
branch_labels = None
depends_on = None

def upgrade():
    op.execute("COMMIT")
    
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_source_enum') THEN
            CREATE TYPE doc_source_enum AS ENUM ('upload', 'digilocker');
        END IF;
    END
    $$;
    """)

    try:
        op.execute("ALTER TYPE bid_status_enum ADD VALUE IF NOT EXISTS 'access_pending'")
        op.execute("ALTER TYPE bid_status_enum ADD VALUE IF NOT EXISTS 'access_denied'")
    except Exception:
        pass

    op.execute("BEGIN")
    
    # Add columns to tenders
    op.add_column('tenders', sa.Column('tender_no', sa.String(), nullable=True))
    op.add_column('tenders', sa.Column('access_type', sa.String(), server_default='public', nullable=True))
    op.add_column('tenders', sa.Column('closing_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('tenders', sa.Column('est_value', sa.Numeric(), nullable=True))
    op.add_column('tenders', sa.Column('private_password', sa.String(), nullable=True))
    op.create_index(op.f('ix_tenders_tender_no'), 'tenders', ['tender_no'], unique=True)
    
    # Add columns to bidders
    op.add_column('bidders', sa.Column('gstin', sa.String(), nullable=True))
    
    # Add columns to bidder_documents
    op.add_column('bidder_documents', sa.Column('source', postgresql.ENUM('upload', 'digilocker', name='doc_source_enum', create_type=False), server_default='upload', nullable=True))
    op.add_column('bidder_documents', sa.Column('digilocker_request_id', sa.String(), nullable=True))
    op.add_column('bidder_documents', sa.Column('digital_signature_valid', sa.Boolean(), nullable=True))
    op.add_column('bidder_documents', sa.Column('confirmed_fields', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('bidder_documents', sa.Column('is_temporary', sa.Boolean(), server_default='false', nullable=True))

def downgrade():
    op.drop_column('bidder_documents', 'is_temporary')
    op.drop_column('bidder_documents', 'confirmed_fields')
    op.drop_column('bidder_documents', 'digital_signature_valid')
    op.drop_column('bidder_documents', 'digilocker_request_id')
    op.drop_column('bidder_documents', 'source')
    
    op.drop_column('bidders', 'gstin')
    
    op.drop_index(op.f('ix_tenders_tender_no'), table_name='tenders')
    op.drop_column('tenders', 'private_password')
    op.drop_column('tenders', 'est_value')
    op.drop_column('tenders', 'closing_date')
    op.drop_column('tenders', 'access_type')
    op.drop_column('tenders', 'tender_no')
