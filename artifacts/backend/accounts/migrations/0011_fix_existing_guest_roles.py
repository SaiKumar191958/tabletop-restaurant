from django.db import migrations

def fix_guest_roles(apps, schema_editor):
    CustomUser = apps.get_model('accounts', 'CustomUser')
    # Update users whose username starts with guest_ to have role='guest'
    CustomUser.objects.filter(username__startswith='guest_').update(role='guest')

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_alter_customuser_email_alter_customuser_username'),
    ]

    operations = [
        migrations.RunPython(fix_guest_roles, reverse_code=migrations.RunPython.noop),
    ]
