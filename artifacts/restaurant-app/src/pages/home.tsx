import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useRestaurant } from "@/lib/restaurant-context";
import { toast } from "react-hot-toast";
import { Star, Leaf, ArrowRight, ShoppingBag, Truck, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: number;
  name: string;
  image?: string;
}

interface FoodItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image?: string;
  food_type: 'veg' | 'nonveg';
  rating: number;
}

export default function Home() {
  const [featured, setFeatured] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featLoading, setFeatLoading] = useState(true);
  const [catLoading, setCatLoading] = useState(true);
  const { addItem } = useCart();
  const { config } = useRestaurant();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, catRes] = await Promise.all([
          api.get('menu/'),
          api.get('categories/')
        ]);
        const menuData = Array.isArray(menuRes.data) ? menuRes.data : menuRes.data.results ?? [];
        const catData = Array.isArray(catRes.data) ? catRes.data : catRes.data.results ?? [];
        setFeatured(menuData.slice(0, 8));
        setCategories(catData);
      } catch (error) {
        console.error("Failed to fetch home data", error);
      } finally {
        setFeatLoading(false);
        setCatLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddToCart = (item: FoodItem) => {
    addItem({ food_item_id: item.id, name: item.name, price: item.price, image: item.image });
    toast.success(`${item.name} added to cart`);
  };

  const restaurantName = config?.name || "Sri Durga Military Hotel";

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-secondary text-secondary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary"
              style={{ width: `${100 + i * 50}px`, height: `${100 + i * 50}px`, top: `${i * 12}%`, right: `${i * 8}%` }}
            />
          ))}
        </div>
        <div className="page-container py-12 sm:py-16 md:py-20 relative">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
                <ShoppingBag className="w-4 h-4" />
                {config?.bulk_order_info || "Bulk order available (6hrs advance booking)"}
              </div>
              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
                <Truck className="w-4 h-4" />
                {config?.delivery_charge_info || "Delivery charges depend on distance"}
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-tight mb-4 sm:mb-6">
              Experience the best flavors at <span className="text-primary">{restaurantName}</span>
            </h1>
            <p className="text-secondary-foreground/70 text-base sm:text-xl mb-6 sm:mb-10 leading-relaxed">
              Handcrafted meals from our kitchen to your table. Fresh ingredients, bold flavors, and delivered fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/menu">
                <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-8 text-base font-semibold">
                  Order Now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              {!config && (
                <Link to="/register">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 sm:h-14 px-8 text-base border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10">
                    Join {restaurantName}
                  </Button>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:gap-8 mt-8 sm:mt-12 text-xs sm:text-sm text-secondary-foreground/60">
              <div><span className="font-bold text-secondary-foreground text-lg sm:text-2xl block">4.9</span> avg rating</div>
              <div><span className="font-bold text-secondary-foreground text-lg sm:text-2xl block">30min</span> avg delivery</div>
              <div><span className="font-bold text-secondary-foreground text-lg sm:text-2xl block">100+</span> dishes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Banner */}
      <div className="bg-primary/10 py-3">
        <div className="page-container flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-primary">
          <Info className="w-4 h-4" />
          <span>Packing charges: ₹{config?.packing_charge || 20} per order</span>
        </div>
      </div>

      {/* Categories */}
      <section className="py-10 sm:py-16 page-container">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8">Browse by Category</h2>
        {catLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            {categories?.map((cat) => (
              <Link key={cat.id} to={`/menu?category_id=${cat.id}`}>
                <div className="group bg-card border border-card-border rounded-2xl p-4 text-center hover:border-primary hover:shadow-lg transition-all cursor-pointer">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors text-2xl">
                    {cat.name.includes("Main") ? "🍛" : cat.name.includes("Starters") ? "🍗" : cat.name.includes("Combo") ? "🍱" : "🍽️"}
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{cat.name}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Items */}
      <section className="py-12 bg-muted/40">
        <div className="page-container">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Top Rated Dishes</h2>
              <p className="text-muted-foreground mt-1">Our most-loved items, rated by real customers</p>
            </div>
            <Link to="/menu" className="sm:shrink-0">
              <Button variant="ghost" className="w-full sm:w-auto gap-2">
                View all <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {featLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured?.map((item) => (
                <div key={item.id} className="group bg-card border border-card-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-48 bg-muted overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <span className="text-5xl">🍽️</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${item.food_type === "veg" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        <Leaf className="w-3 h-3" />
                        {item.food_type === "veg" ? "Veg" : "Non-Veg"}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {item.rating?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{item.name}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{item.description}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base sm:text-lg font-bold text-primary">₹{Number(item.price).toFixed(2)}</span>
                      <Button size="sm" onClick={() => handleAddToCart(item)} className="h-8 shrink-0 text-xs sm:text-sm">
                        Add to cart
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
