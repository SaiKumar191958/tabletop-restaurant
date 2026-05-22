import re
from django.apps import apps

def get_next_member_id():
    CustomUser = apps.get_model('accounts', 'CustomUser')
    last_member = CustomUser.objects.exclude(member_id__isnull=True).order_by('-member_id').first()
    if last_member and last_member.member_id.isdigit():
        return str(int(last_member.member_id) + 1)
    return "1000000"

def generate_unique_username(first_name, last_name, email=None):
    # Now that CustomUser.username is unique=False, we just return the name as is.
    # The member_id remains the unique identifier.
    
    base_username = f"{first_name} {last_name}".strip()
    if not base_username:
        if email:
            base_username = email.split('@')[0]
        else:
            base_username = "user"
            
    member_id = get_next_member_id()
    return base_username, member_id
