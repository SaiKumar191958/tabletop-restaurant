import { useState, useEffect } from "react";
import {
  useListMenuItems,
  useListCategories,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  getListMenuItemsQueryKey,
  searchExternalFood,
  type ExternalFoodResult,
} from "@/lib/api-hooks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, UtensilsCrossed, Link2, Upload, ImageOff, Search, Loader2, Sparkles } from "lucide-react";
import type { FoodItem, MenuItemInput } from "@/lib/api-hooks";

type FoodItemType = FoodItem;
type ImageMode = "none" | "url" | "upload";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  food_type: "veg" as "veg" | "nonveg",
  is_available: true,
  category_id: "",
  image_url: "",
  imageFile: null as File | null,
  imageMode: "none" as ImageMode,
};

export default function AdminMenu() {
  const qc = useQueryClient();
  const { data: items, isLoading } = useListMenuItems();
  const { data: categories } = useListCategories();
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const deleteMutation = useDeleteMenuItem();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FoodItemType | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [foodSearch, setFoodSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(foodSearch.trim()), 400);
    return () => clearTimeout(timer);
  }, [foodSearch]);

  const { data: externalResults, isFetching: searchLoading } = useQuery({
    queryKey: ["external-food-search", debouncedSearch],
    queryFn: () => searchExternalFood(debouncedSearch),
    enabled: open && !editing && debouncedSearch.length >= 2,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFoodSearch("");
    setDebouncedSearch("");
    setOpen(true);
  };
  const openEdit = (item: FoodItemType) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      food_type: item.food_type as "veg" | "nonveg",
      is_available: item.is_available,
      category_id: String(item.category_id),
      image_url: item.image ?? "",
      imageFile: null,
      imageMode: item.image ? "url" : "none",
    });
    setFoodSearch("");
    setDebouncedSearch("");
    setOpen(true);
  };

  const applyExternalFood = (item: ExternalFoodResult) => {
    const matchedCategory = categories?.find(
      (c) => c.name.toLowerCase() === item.suggested_category.toLowerCase(),
    );
    const fallbackCategory = categories?.[0];

    setForm({
      ...form,
      name: item.name,
      description: item.description,
      image_url: item.image_url,
      imageMode: "url",
      imageFile: null,
      food_type: item.food_type,
      category_id: String(matchedCategory?.id ?? fallbackCategory?.id ?? ""),
    });
    toast({
      title: "Imported from food database",
      description: "Review the price and details, then save.",
    });
  };

  const buildPayload = (): MenuItemInput => {
    const base: MenuItemInput = {
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price),
      food_type: form.food_type,
      is_available: form.is_available,
      category_id: Number(form.category_id),
    };

    if (form.imageMode === "upload" && form.imageFile) {
      return { ...base, imageFile: form.imageFile };
    }
    if (form.imageMode === "url" && form.image_url.trim()) {
      return { ...base, image_url: form.image_url.trim() };
    }
    return { ...base, image_url: "" };
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.price || !form.category_id) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    if (form.imageMode === "upload" && !form.imageFile && !editing) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    const payload = buildPayload();

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Item updated" }); }, onError: () => toast({ title: "Failed to update", variant: "destructive" }) }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        { onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Item created" }); }, onError: () => toast({ title: "Failed to create", variant: "destructive" }) }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this menu item?")) return;
    deleteMutation.mutate(
      { id },
      { onSuccess: () => { invalidate(); toast({ title: "Item deleted" }); }, onError: () => toast({ title: "Failed to delete", variant: "destructive" }) }
    );
  };

  return (
    <div className="page-container py-5 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
          <h1 className="page-title">Manage Menu</h1>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 w-4 h-4" /> Add Item
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="bg-card border border-card-border rounded-2xl overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-[32rem]">
            <thead className="bg-muted/50 text-sm text-muted-foreground">
              <tr>
                <th className="text-left px-6 py-4 font-semibold">Item</th>
                <th className="text-left px-6 py-4 font-semibold hidden md:table-cell">Category</th>
                <th className="text-left px-6 py-4 font-semibold hidden sm:table-cell">Type</th>
                <th className="text-left px-6 py-4 font-semibold">Price</th>
                <th className="text-left px-6 py-4 font-semibold hidden sm:table-cell">Status</th>
                <th className="text-right px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items?.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                        )}
                      </div>
                      <span className="font-medium text-sm line-clamp-1">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">{item.category?.name ?? "-"}</td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${item.food_type === "veg" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {item.food_type === "veg" ? "Veg" : "Non-Veg"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-primary">${item.price.toFixed(2)}</td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${item.is_available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {item.is_available ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No menu items yet. Add one!</div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] sm:w-full max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
            {!editing && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="w-4 h-4" />
                  Search food database (free)
                </div>
                <p className="text-xs text-muted-foreground">
                  Search TheMealDB for dishes. Tap a result to auto-fill, or add manually below if not found.
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={foodSearch}
                    onChange={(e) => setFoodSearch(e.target.value)}
                    placeholder="e.g. burger, pasta, tiramisu..."
                    className="pl-9"
                  />
                </div>
                {foodSearch.trim().length > 0 && foodSearch.trim().length < 2 && (
                  <p className="text-xs text-muted-foreground">Type at least 2 characters to search.</p>
                )}
                {searchLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </div>
                )}
                {!searchLoading && debouncedSearch.length >= 2 && externalResults?.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">
                    No matches for &quot;{debouncedSearch}&quot;. Add the item manually below.
                  </p>
                )}
                {externalResults && externalResults.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {externalResults.map((item) => (
                      <button
                        key={item.external_id}
                        type="button"
                        onClick={() => applyExternalFood(item)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 text-left transition-colors"
                      >
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-md object-cover shrink-0 bg-muted" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.meal_category} · suggests {item.suggested_category}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-primary shrink-0">Use</span>
                      </button>
                    ))}
                  </div>
                )}
                <Separator />
                <p className="text-xs font-medium text-muted-foreground">Or enter details manually</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dish name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.food_type} onValueChange={(v) => setForm({ ...form, food_type: v as "veg" | "nonveg" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veg">Veg</SelectItem>
                    <SelectItem value="nonveg">Non-Veg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.is_available ? "available" : "unavailable"} onValueChange={(v) => setForm({ ...form, is_available: v === "available" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Image</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { mode: "none" as const, label: "No image", icon: ImageOff },
                  { mode: "url" as const, label: "URL", icon: Link2 },
                  { mode: "upload" as const, label: "Upload", icon: Upload },
                ]).map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setForm({ ...form, imageMode: mode, imageFile: null })}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-xs font-medium transition-colors ${
                      form.imageMode === mode
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {form.imageMode === "url" && (
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                />
              )}

              {form.imageMode === "upload" && (
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })}
                  />
                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP or GIF (max 5MB recommended)</p>
                </div>
              )}

              {(form.image_url || form.imageFile) && (
                <div className="w-full h-32 rounded-lg bg-muted overflow-hidden border border-border">
                  {form.imageFile ? (
                    <img
                      src={URL.createObjectURL(form.imageFile)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : form.image_url ? (
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
