from django.db import migrations


def seed_default_categories(apps, schema_editor) -> None:
    Category = apps.get_model("items", "Category")

    # Seed values are intentionally stable and idempotent.
    defaults = [
        {"name": "Frutas", "emoji": "🍎", "color_hex": "#E53935"},
        {"name": "Laticínios", "emoji": "🥛", "color_hex": "#4DA3FF"},
        {"name": "Carnes", "emoji": "🥩", "color_hex": "#FF6B3D"},
        {"name": "Limpeza", "emoji": "🧹", "color_hex": "#2ED573"},
        {"name": "Bebidas", "emoji": "🥤", "color_hex": "#7E90FF"},
        {"name": "Padaria", "emoji": "🥖", "color_hex": "#C9A227"},
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

