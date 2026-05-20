import { useState } from "react";
import { useSearch } from "wouter";
import { useNavigate } from "react-router-dom";
import { useListMenuItems, useListCategories } from "@/lib/api-hooks";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Star, Leaf, Search, SlidersHorizontal, X } from "lucide-react";

export default function MenuPage() {
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);
  const initialCat = params.get("category_id") ? Number(params.get("category_id")) : null;

  const [searchQ, setSearchQ] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | null>(initialCat);
  const [foodType, setFoodType] = useState<"veg" | "nonveg" | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const { data: categories } = useListCategories();
  const { data: items, isLoading } = useListMenuItems({
    category_id: selectedCat ?? undefined,
    food_type: foodType ?? undefined,
    max_price: maxPrice ?? undefined,
    search: searchQ || undefined,
  });

  const { addItem, items: cartItems } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddToCart = (item: NonNullable<typeof items>[0]) => {
    const isInCart = cartItems.some(i => i.food_item_id === item.id);
    if (isInCart) {
      navigate("/cart");
      return;
    }
    addItem({ food_item_id: item.id, name: item.name, price: item.price, image: item.image });
    toast({ title: "Added to cart", description: `${item.name} has been added.` });
  };

  const clearFilters = () => {
    setSelectedCat(null);
    setFoodType(null);
    setMaxPrice(null);
    setSearchQ("");
  };

  const hasFilters = selectedCat || foodType || maxPrice || searchQ;

  const filterChip = (active: boolean) =>
    `shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"
    }`;

  return (
    <div className="page-container py-5 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="page-title">Full Menu</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {items ? `${items.length} items available` : "Loading..."}
        </p>
      </div>

      {/* Mobile filters */}
      <div className="lg:hidden space-y-3 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <button onClick={() => setSelectedCat(null)} className={filterChip(!selectedCat)}>All</button>
          {categories?.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCat(cat.id)} className={filterChip(selectedCat === cat.id)}>
              {cat.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { val: null, label: "All types" },
            { val: "veg" as const, label: "Veg" },
            { val: "nonveg" as const, label: "Non-Veg" },
          ].map(({ val, label }) => (
            <button key={label} onClick={() => setFoodType(val)} className={filterChip(foodType === val)}>
              {label}
            </button>
          ))}
          {[null, 100, 200, 500].map((price) => (
            <button key={price ?? "any"} onClick={() => setMaxPrice(price)} className={filterChip(maxPrice === price)}>
              {price === null ? "Any price" : `≤ ₹${price}`}
            </button>
          ))}
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-primary font-medium px-2 py-1.5">
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Desktop sidebar filters */}
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <div className="bg-card border border-card-border rounded-2xl p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-semibold">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>

            <Separator className="mb-4" />

            <div className="space-y-5">
              {/* Category */}
              <div>
                <p className="text-sm font-semibold mb-2">Category</p>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCat(null)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${!selectedCat ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    All Categories
                  </button>
                  {categories?.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCat(cat.id)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${selectedCat === cat.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Food type */}
              <div>
                <p className="text-sm font-semibold mb-2">Type</p>
                <div className="flex gap-2">
                  {[
                    { val: null, label: "All" },
                    { val: "veg" as const, label: "Veg" },
                    { val: "nonveg" as const, label: "Non-Veg" },
                  ].map(({ val, label }) => (
                    <button
                      key={label}
                      onClick={() => setFoodType(val)}
                      className={`flex-1 text-xs py-2 rounded-lg border font-medium transition-colors ${foodType === val ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Price range */}
              <div>
                <p className="text-sm font-semibold mb-2">Max Price</p>
                <div className="grid grid-cols-2 gap-2">
                  {[null, 100, 200, 500].map((price) => (
                    <button
                      key={price ?? "all"}
                      onClick={() => setMaxPrice(price)}
                      className={`text-xs py-2 px-3 rounded-lg border font-medium transition-colors ${maxPrice === price ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                    >
                      {price === null ? "Any" : `₹${price}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Items grid */}
        <div className="flex-1">
          {/* Search bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search dishes..."
              className="pl-9"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
            </div>
          ) : items?.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No items match your filters.</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {items?.map((item) => (
                <div key={item.id} className="group bg-card border border-card-border rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="relative h-44 bg-muted overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <span className="text-4xl">🍽️</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${item.food_type === "veg" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        <Leaf className="w-3 h-3" />
                        {item.food_type === "veg" ? "Veg" : "Non-Veg"}
                      </span>
                    </div>
                    {!item.is_available && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-black/70 text-white text-sm font-medium px-3 py-1 rounded-full">Unavailable</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-foreground line-clamp-1 flex-1">{item.name}</h3>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2 shrink-0">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {item.rating?.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{item.description}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base sm:text-lg font-bold text-primary">₹{item.price.toFixed(2)}</span>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.is_available}
                        className={`h-8 shrink-0 text-xs sm:text-sm ${cartItems.some(i => i.food_item_id === item.id) ? "bg-green-600 hover:bg-green-700" : ""}`}
                      >
                        {!item.is_available ? "Unavailable" : cartItems.some(i => i.food_item_id === item.id) ? "Proceed" : "Add to cart"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
