"""Initial migration

Revision ID: 5fdf99baade6
Revises: 
Create Date: 2026-03-01 19:21:34.980970

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5fdf99baade6'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create all tables first
    op.create_table('candidates',
        sa.Column('candidate_id', sa.String(50), nullable=False),
        sa.Column('full_name', sa.String(255)),
        sa.Column('party', sa.String(100)),
        sa.Column('position', sa.String(100)),
        sa.Column('county', sa.String(100)),
        sa.Column('election_year', sa.Integer),
        sa.PrimaryKeyConstraint('candidate_id')
    )
    op.create_table('donors',
        sa.Column('donor_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(255)),
        sa.Column('type', sa.String(50)),
        sa.Column('industry', sa.String(100)),
        sa.Column('home_county', sa.String(100)),
        sa.Column('tier', sa.Integer),
        sa.PrimaryKeyConstraint('donor_id')
    )
    op.create_table('donations',
        sa.Column('donation_id', sa.Integer, nullable=False),
        sa.Column('donor_id', sa.String(50)),
        sa.Column('candidate_id', sa.String(50)),
        sa.Column('amount', sa.Numeric),
        sa.Column('date', sa.Date),
        sa.Column('election_year', sa.Integer),
        sa.PrimaryKeyConstraint('donation_id')
    )
    # Add other tables (counties, election_cycles, simulation_parameters) here...

    # 2. Create indexes after tables exist
    op.create_index(op.f('ix_candidates_candidate_id'), 'candidates', ['candidate_id'], unique=False)
    op.create_index(op.f('ix_donors_donor_id'), 'donors', ['donor_id'], unique=False)
    op.create_index(op.f('ix_donations_donation_id'), 'donations', ['donation_id'], unique=False)

def downgrade() -> None:
    # Drop in reverse order
    op.drop_table('donations')
    op.drop_table('donors')
    op.drop_table('candidates')
