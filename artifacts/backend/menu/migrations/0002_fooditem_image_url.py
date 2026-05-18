from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='fooditem',
            name='image_url',
            field=models.URLField(blank=True, default='', max_length=500),
        ),
    ]
