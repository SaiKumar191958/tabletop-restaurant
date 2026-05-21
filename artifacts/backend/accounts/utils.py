import re
from django.apps import apps

def get_next_member_id():
    CustomUser = apps.get_model('accounts', 'CustomUser')
    last_member = CustomUser.objects.exclude(member_id__isnull=True).order_by('-member_id').first()
    if last_member and last_member.member_id.isdigit():
        return str(int(last_member.member_id) + 1)
    return "1000000"

def generate_unique_username(first_name, last_name, email=None):
    CustomUser = apps.get_model('accounts', 'CustomUser')
    
    # Sanitize: only alphanumeric
    first = re.sub(r'[^a-zA-Z0-9]', '', first_name).lower()
    last = re.sub(r'[^a-zA-Z0-9]', '', last_name).lower()
    
    base_username = f"{first}{last}"
    if not base_username:
        if email:
            base_username = email.split('@')[0]
        else:
            base_username = "user"
            
    # If base_username is unique, use it
    if not CustomUser.objects.filter(username__iexact=base_username).exists():
        return base_username, None
        
    # Otherwise, we need a member_id to make it unique
    member_id = get_next_member_id()
    return f"{base_username}{member_id}", member_id
