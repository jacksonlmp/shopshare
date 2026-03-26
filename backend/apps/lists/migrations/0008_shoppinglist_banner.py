from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("lists", "0007_shoppinglist_description_db_default"),
    ]

    operations = [
        migrations.AddField(
            model_name="shoppinglist",
            name="banner_color_hex",
            field=models.CharField(blank=True, default="", max_length=7),
        ),
        migrations.AddField(
            model_name="shoppinglist",
            name="banner_image_url",
            field=models.CharField(blank=True, default="", max_length=512),
        ),
    ]
