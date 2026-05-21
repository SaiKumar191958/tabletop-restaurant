from rest_framework import viewsets, permissions, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Category, FoodItem, RestaurantConfig
from .serializers import CategorySerializer, FoodItemSerializer, RestaurantConfigSerializer
from .external_search import search_external_foods
from accounts.permissions import IsAdminOrSuperAdmin

class RestaurantConfigView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        config, _ = RestaurantConfig.objects.get_or_create(id=1)
        serializer = RestaurantConfigSerializer(config)
        return Response(serializer.data)

    def patch(self, request):
        # Admin only for updates
        if not request.user.is_authenticated or not (request.user.role in ['admin', 'superadmin']):
            return Response({"error": "Unauthorized"}, status=403)
        
        config, _ = RestaurantConfig.objects.get_or_create(id=1)
        
        serializer = RestaurantConfigSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

import csv
import io
from rest_framework import viewsets, permissions, parsers, status
# ... (rest of imports)

class BulkMenuItemUploadView(APIView):
    permission_classes = (IsAdminOrSuperAdmin,)
    parser_classes = (parsers.MultiPartParser,)

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not file.name.endswith('.csv'):
            return Response({"error": "File must be a CSV"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded_file = file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            created_count = 0
            errors = []
            
            for row_idx, row in enumerate(reader, start=2):
                try:
                    name = row.get('name')
                    category_name = row.get('category')
                    price = row.get('price')
                    food_type = row.get('food_type', 'veg').lower()
                    description = row.get('description', '')
                    stock = row.get('stock', '10')
                    
                    if not name or not category_name or not price:
                        errors.append(f"Row {row_idx}: Missing required fields (name, category, price)")
                        continue
                        
                    category, _ = Category.objects.get_or_create(name=category_name)
                    
                    FoodItem.objects.create(
                        name=name,
                        category=category,
                        price=float(price),
                        food_type=food_type if food_type in ['veg', 'nonveg'] else 'veg',
                        description=description,
                        default_stock=int(stock),
                        current_stock=int(stock),
                        is_available=True
                    )
                    created_count += 1
                except Exception as e:
                    errors.append(f"Row {row_idx}: {str(e)}")
            
            return Response({
                "message": f"Successfully uploaded {created_count} items.",
                "errors": errors if errors else None
            }, status=status.HTTP_201_CREATED if created_count > 0 else status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({"error": f"Failed to process CSV: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
