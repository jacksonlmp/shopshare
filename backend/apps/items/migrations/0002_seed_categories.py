from django.db import migrations


def seed_default_categories(apps, schema_editor) -> None:
    Category = apps.get_model("items", "Category")

    # Seed values are intentionally stable and idempotent.
    defaults = [
        {"name": "Fruits", "emoji": "🍓", "color_hex": "#FF4D4D"},
        {"name": "Dairy", "emoji": "🥛", "color_hex": "#4DA3FF"},
        {"name": "Meat", "emoji": "🥩", "color_hex": "#FF6B3D"},
        {"name": "Cleaning", "emoji": "🧼", "color_hex": "#2ED573"},
        {"name": "Snacks", "emoji": "🍿", "color_hex": "#FDCB6E"},
        {"name": "Drinks", "emoji": "🥤", "color_hex": "#7E90FF"},
    ]

    for item in defaults:
        Category.objects.get_or_create(
            name=item["name"],
            defaults={"emoji": item["emoji"], "color_hex": item["color_hex"]},
        )


class Migration(migrations.Migration):
    dependencies = [
        ("items", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_default_categories, migrations.RunPython.noop),
    ]

