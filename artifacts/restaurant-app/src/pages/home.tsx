import { Link } from "wouter";
import { useGetFeaturedItems, useListCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import { Star, Leaf, ArrowRight, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: featured, isLoading: featLoading } = useGetFeaturedItems();
  const { data: categories, isLoading: catLoading } = useListCategories();
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (item: NonNullable<typeof featured>[0]) => {
    addItem({ food_item_id: item.id, name: item.name, price: item.price, image: item.image });
    toast({ title: "Added to cart", description: `${item.name} has been added to your cart.` });
  };

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
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <ShoppingBag className="w-4 h-4" />
              Free delivery on first order
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Food that makes you <span className="text-primary">crave</span> more
            </h1>
            <p className="text-secondary-foreground/70 text-xl mb-10 leading-relaxed">
              Handcrafted meals from top local kitchens. Fresh ingredients, bold flavors, and delivered fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/menu">
                <Button size="lg" className="h-14 px-8 text-base font-semibold">
                  Browse Menu <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10">
                  Join TableTop
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-8 mt-12 text-sm text-secondary-foreground/60">
              <div><span className="font-bold text-secondary-foreground text-2xl">4.9</span> avg rating</div>
              <div><span className="font-bold text-secondary-foreground text-2xl">30min</span> avg delivery</div>
              <div><span className="font-bold text-secondary-foreground text-2xl">100+</span> dishes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-2xl font-bold text-foreground mb-8">Browse by Category</h2>
        {catLoading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categories?.map((cat) => (
              <Link key={cat.id} href={`/menu?category_id=${cat.id}`}>
                <div className="group bg-card border border-card-border rounded-2xl p-4 text-center hover:border-primary hover:shadow-lg transition-all cursor-pointer">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                    <span className="text-2xl">
                      {cat.name === "Burgers" ? "🍔" : cat.name === "Pizza" ? "🍕" : cat.name === "Pasta" ? "🍝" : cat.name === "Salads" ? "🥗" : cat.name === "Desserts" ? "🍰" : "🥤"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Items */}
      <section className="py-12 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Top Rated Dishes</h2>
              <p className="text-muted-foreground mt-1">Our most-loved items, rated by real customers</p>
            </div>
            <Link href="/menu">
              <Button variant="ghost" className="hidden sm:flex gap-2">
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
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">${item.price.toFixed(2)}</span>
                      <Button size="sm" onClick={() => handleAddToCart(item)} className="h-8">
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
