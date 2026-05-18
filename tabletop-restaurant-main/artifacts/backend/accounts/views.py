from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser
from .serializers import UserSerializer, RequestOTPSerializer, VerifyOTPSerializer
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


class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

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
