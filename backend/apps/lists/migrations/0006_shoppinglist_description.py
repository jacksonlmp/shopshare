from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("lists", "0005_add_listmember_id_pk"),
    ]

    operations = [
        migrations.AddField(
            model_name="shoppinglist",
            name="description",
            field=models.TextField(blank=True, default=""),
        ),
    ]
