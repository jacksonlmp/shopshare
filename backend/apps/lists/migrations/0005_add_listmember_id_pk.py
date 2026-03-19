from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("lists", "0004_alter_listmember_id"),
    ]

    operations = [
        migrations.RunSQL(
            """
            ALTER TABLE list_members
            ADD COLUMN IF NOT EXISTS id BIGSERIAL;
            """,
            reverse_sql="""
            ALTER TABLE list_members
            DROP COLUMN IF EXISTS id;
            """,
        ),
        migrations.RunSQL(
            """
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'list_members_pkey'
              ) THEN
                ALTER TABLE list_members
                ADD CONSTRAINT list_members_pkey PRIMARY KEY (id);
              END IF;
            END $$;
            """,
            reverse_sql="""
            ALTER TABLE list_members
            DROP CONSTRAINT IF EXISTS list_members_pkey;
            """,
        ),
    ]

