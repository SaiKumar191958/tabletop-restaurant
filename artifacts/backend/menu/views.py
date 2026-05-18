from rest_framework import viewsets, permissions, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Category, FoodItem
from .serializers import CategorySerializer, FoodItemSerializer
from .external_search import search_external_foods
from accounts.permissions import IsAdminOrSuperAdmin

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminOrSuperAdmin()]

class FoodItemViewSet(viewsets.ModelViewSet):
    queryset = FoodItem.objects.select_related('category').all()
    serializer_class = FoodItemSerializer
    parser_classes = [parsers.JSONParser, parsers.FormParser, parsers.MultiPartParser]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminOrSuperAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        category_id = params.get('category_id')
        if category_id:
            qs = qs.filter(category_id=category_id)

        food_type = params.get('food_type')
        if food_type:
            qs = qs.filter(food_type=food_type)

        max_price = params.get('max_price')
        if max_price:
            qs = qs.filter(price__lte=max_price)

        search = params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)

        return qs


class ExternalFoodSearchView(APIView):
    """Search free TheMealDB database to pre-fill new menu items (admin only)."""
    permission_classes = (IsAdminOrSuperAdmin,)

    def get(self, request):
        query = request.query_params.get('q', '')
        limit = min(int(request.query_params.get('limit', 8)), 15)
        results = search_external_foods(query, limit=limit)
        return Response({
            'query': query.strip(),
            'source': 'TheMealDB (free)',
            'results': results,
        })
