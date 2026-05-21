from rest_framework import serializers
from .models import CustomUser, UserAddress

class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = ('id', 'address_type', 'address_line', 'is_default')

class UserSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='date_joined', read_only=True)
    addresses = UserAddressSerializer(many=True, read_only=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'member_id', 'role', 'phone', 'profile_image', 'createdAt', 'addresses')

class RequestOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=['login', 'register'])


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)
    purpose = serializers.ChoiceField(choices=['login', 'register'])
    username = serializers.CharField(required=False, allow_blank=True, max_length=150)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=15)
