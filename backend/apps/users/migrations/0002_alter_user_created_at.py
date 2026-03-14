from django.db import migrations, models

import apps.users.models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="created_at",
            field=models.BigIntegerField(default=apps.users.models.now_ms),
        ),
    ]
