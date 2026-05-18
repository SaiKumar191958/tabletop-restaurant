from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='payment_method',
            field=models.CharField(
                choices=[('cod', 'Cash on Delivery'), ('upi', 'UPI'), ('card', 'Card')],
                default='cod',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='payment_status',
            field=models.CharField(
                choices=[('unpaid', 'Unpaid'), ('paid', 'Paid'), ('failed', 'Failed')],
                default='unpaid',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='payment_provider',
            field=models.CharField(blank=True, default='static', max_length=20),
        ),
        migrations.AddField(
            model_name='order',
            name='payment_reference',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='order',
            name='paid_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
