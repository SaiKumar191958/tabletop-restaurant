from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import (
    EmailConfigView,
    RequestOTPView,
    VerifyOTPView,
    GuestLoginView,
    UserDetailView,
    AdminUserListView,
    AdminUserRoleUpdateView,
)
from accounts.dashboard import DashboardStatsView
from orders.views import (
    OrderCreateListView,
    AdminOrderListView,
    AdminOrderUpdateView,
    OrderStatusUpdateView
)
from orders.payment_views import PaymentConfigView
from rest_framework.routers import DefaultRouter
from menu.views import CategoryViewSet, FoodItemViewSet, ExternalFoodSearchView, RestaurantConfigView, BulkMenuItemUploadView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'menu', FoodItemViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/restaurant/config/', RestaurantConfigView.as_view(), name='restaurant_config'),
    path('api/menu/bulk-upload/', BulkMenuItemUploadView.as_view(), name='bulk_menu_upload'),
    # Before router — otherwise menu/<pk> captures "search-external"
    path('api/menu/search-external/', ExternalFoodSearchView.as_view(), name='menu_search_external'),
    path('api/', include(router.urls)),
    
    # Auth (email OTP — no password login)
    path('api/auth/email-config/', EmailConfigView.as_view(), name='email_config'),
    path('api/auth/otp/request/', RequestOTPView.as_view(), name='otp_request'),
    path('api/auth/otp/verify/', VerifyOTPView.as_view(), name='otp_verify'),
    path('api/auth/guest-login/', GuestLoginView.as_view(), name='guest_login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(permission_classes=[AllowAny]), name='token_refresh'),
    path('api/auth/me/', UserDetailView.as_view(), name='user_detail'),
    
    # Payments (static demo — see GET for Razorpay live requirements)
    path('api/payments/config/', PaymentConfigView.as_view(), name='payment_config'),

    # Orders
    path('api/orders/', OrderCreateListView.as_view(), name='orders_list_create'),
    path('api/orders/all/', AdminOrderListView.as_view(), name='admin_orders_all'),
    path('api/orders/<int:pk>/status/', OrderStatusUpdateView.as_view(), name='order_status_update'),
    path('api/admin/orders/<int:pk>/', AdminOrderUpdateView.as_view(), name='admin_order_update'),
    
    # Admin dashboard
    path('api/admin/dashboard/', DashboardStatsView.as_view(), name='admin_dashboard'),

    # SuperAdmin: User Management
    path('api/admin/users/', AdminUserListView.as_view(), name='admin_users_list'),
    path('api/admin/users/<int:pk>/role/', AdminUserRoleUpdateView.as_view(), name='admin_user_role_update'),
]

# Serve media files in all environments (including production)
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
