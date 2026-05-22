from django.conf import settings
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser, UserAddress
from .serializers import UserSerializer, RequestOTPSerializer, VerifyOTPSerializer, UserAddressSerializer
from .permissions import IsSuperAdmin
from . import otp_service


def _tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


class EmailConfigView(APIView):
    """Check whether real SMTP email is configured."""
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        delivery = getattr(settings, "EMAIL_OTP_DELIVERY", "console")
        return Response({
            "delivery": delivery,
            "configured": delivery == "smtp",
            "from_email": settings.DEFAULT_FROM_EMAIL,
            "message": (
                "OTP codes are sent to the user's inbox."
                if delivery == "smtp"
                else "Set EMAIL_HOST, EMAIL_HOST_USER, and EMAIL_HOST_PASSWORD in artifacts/backend/.env"
            ),
        })


class RequestOTPView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        purpose = serializer.validated_data['purpose']
        try:
            result = otp_service.request_otp(email, purpose)
        except LookupError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {'detail': 'Could not send verification code. Try again in a moment.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(result)


class VerifyOTPView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            user = otp_service.verify_otp(
                data['email'],
                data['otp'],
                data['purpose'],
                username=data.get('username', ''),
                phone=data.get('phone', ''),
            )
        except LookupError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        tokens = _tokens_for_user(user)
        return Response({
            **tokens,
            'user': UserSerializer(user).data,
        })


from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

class GoogleLoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token = request.data.get('id_token')
        client_id = getattr(settings, "GOOGLE_CLIENT_ID", None)
        
        if not token:
            return Response({"error": "id_token is required"}, status=400)
        if not client_id:
            return Response({"error": "Google Client ID not configured on server"}, status=500)

        try:
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)

            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')

            email = idinfo['email']
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')

            # Find or create user
            user = CustomUser.objects.filter(email=email).first()
            if not user:
                from .utils import generate_unique_username
                username, member_id = generate_unique_username(first_name, last_name, email=email)
                user = CustomUser.objects.create(
                    email=email,
                    username=username,
                    first_name=first_name,
                    last_name=last_name,
                    member_id=member_id,
                )
            elif not user.member_id:
                from .utils import get_next_member_id
                user.member_id = get_next_member_id()
                user.save()

            tokens = _tokens_for_user(user)
            return Response({
                **tokens,
                'user': UserSerializer(user).data,
                'message': 'Signed in with Google'
            })

        except ValueError as e:
            return Response({"error": f"Invalid token: {str(e)}"}, status=400)
        except Exception as e:
            return Response({"error": f"Authentication failed: {str(e)}"}, status=500)

class GuestLoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        device_id = request.data.get('device_id')
        if not device_id:
            return Response({"error": "device_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find or create guest user
        username = f"guest_{device_id[:20]}"
        user, created = CustomUser.objects.get_or_create(
            device_id=device_id,
            defaults={
                'username': username,
                'role': 'guest',
                'is_active': True,
            }
        )
        
        if created:
            user.set_unusable_password()
            user.save()

        tokens = _tokens_for_user(user)
        return Response({
            **tokens,
            'user': UserSerializer(user).data,
            'message': 'Logged in as guest' if not created else 'Guest account created'
        })

class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class UserAddressViewSet(viewsets.ModelViewSet):
    serializer_class = UserAddressSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # If this is the first address, make it default
        is_default = not UserAddress.objects.filter(user=self.request.user).exists()
        if serializer.validated_data.get('is_default'):
            # Clear other defaults
            UserAddress.objects.filter(user=self.request.user).update(is_default=False)
            is_default = True
        serializer.save(user=self.request.user, is_default=is_default)

    def perform_update(self, serializer):
        if serializer.validated_data.get('is_default'):
            UserAddress.objects.filter(user=self.request.user).exclude(pk=self.kwargs['pk']).update(is_default=False)
        serializer.save()

class AdminUserListView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = (IsSuperAdmin,)

class AdminUserRoleUpdateView(APIView):
    permission_classes = (IsSuperAdmin,)

    def patch(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
            role = request.data.get('role')
            if role in dict(CustomUser.ROLE_CHOICES):
                user.role = role
                user.save()
                return Response(UserSerializer(user).data)
            return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
