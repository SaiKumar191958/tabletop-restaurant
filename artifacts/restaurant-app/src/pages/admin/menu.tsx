import { useState, useEffect } from "react";
import {
  useListMenuItems,
  useListCategories,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  getListMenuItemsQueryKey,
  getListCategoriesQueryKey,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, UtensilsCrossed, Link2, Upload, ImageOff, Search, Loader2, Sparkles, FolderTree } from "lucide-react";
import type { FoodItem, MenuItemInput, Category, CategoryInput } from "@/lib/api-hooks";

type ImageMode = "none" | "url" | "upload";

const emptyItemForm = {
  name: "",
  description: "",
  price: "",
  food_type: "veg" as "veg" | "nonveg",
  is_available: true,
  category_id: "",
  image_url: "",
  imageFile: null as File | null,
  imageMode: "none" as ImageMode,
  default_stock: "10",
  current_stock: "10",
};

const emptyCatForm = {
  name: "",
  image_url: "",
  imageFile: null as File | null,
  imageMode: "none" as ImageMode,
};

export default function AdminMenu() {
  const qc = useQueryClient();
  const { data: items, isLoading: itemsLoading } = useListMenuItems();
  const { data: categories, isLoading: catsLoading } = useListCategories();
  
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();
  
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();
  
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("items");
  const [itemDialogOpen, setItemOpen] = useState(false);
  const [catDialogOpen, setCatOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState(emptyCatForm);

  const [foodSearch, setFoodSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(foodSearch.trim()), 400);
    return () => clearTimeout(timer);
  }, [foodSearch]);

  const { data: externalResults, isFetching: searchLoading } = useQuery({
    queryKey: ["external-food-search", debouncedSearch],
    queryFn: () => searchExternalFood(debouncedSearch),
    enabled: itemDialogOpen && !editingItem && debouncedSearch.length >= 2,
  });

  const invalidateItems = () => qc.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
  const invalidateCats = () => qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });

  // ——— Items Logic ———
  const openCreateItem = () => {
    setEditingItem(null);
    setItemForm(emptyItemForm);
    setFoodSearch("");
    setDebouncedSearch("");
    setItemOpen(true);
  };
  const openEditItem = (item: FoodItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      food_type: item.food_type as "veg" | "nonveg",
      is_available: item.is_available,
      category_id: String(item.category_id),
      image_url: item.image ?? "",
      imageFile: null,
      imageMode: item.image ? "url" : "none",
      default_stock: String(item.default_stock ?? 10),
      current_stock: String(item.current_stock ?? 10),
    });
    setFoodSearch("");
    setDebouncedSearch("");
    setItemOpen(true);
  };

  const handleSaveItem = () => {
    if (!itemForm.name.trim() || !itemForm.price || !itemForm.category_id) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    const basePayload: MenuItemInput = {
      name: itemForm.name,
      description: itemForm.description || undefined,
      price: Number(itemForm.price),
      food_type: itemForm.food_type,
      is_available: itemForm.is_available,
      category_id: Number(itemForm.category_id),
      default_stock: Number(itemForm.default_stock),
      current_stock: Number(itemForm.current_stock),
    };
    let payload = basePayload;
    if (itemForm.imageMode === "upload" && itemForm.imageFile) payload = { ...basePayload, imageFile: itemForm.imageFile };
    else if (itemForm.imageMode === "url") payload = { ...basePayload, image_url: itemForm.image_url };
    else payload = { ...basePayload, image_url: "" };

    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, data: payload }, {
        onSuccess: () => { invalidateItems(); setItemOpen(false); toast({ title: "Item updated" }); },
        onError: (err: any) => {
          const data = err.response?.data;
          const msg = typeof data === 'object' ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(", ") : "Failed to update";
          toast({ title: "Update Failed", description: msg, variant: "destructive" });
        }
      });
    } else {
      createItem.mutate({ data: payload }, {
        onSuccess: () => { invalidateItems(); setItemOpen(false); toast({ title: "Item created" }); },
        onError: (err: any) => {
          const data = err.response?.data;
          const msg = typeof data === 'object' ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(", ") : "Failed to create";
          toast({ title: "Creation Failed", description: msg, variant: "destructive" });
        }
      });
    }
  };

  const handleDeleteItem = (id: number) => {
    if (!confirm("Delete this menu item?")) return;
    deleteItem.mutate({ id }, {
      onSuccess: () => { invalidateItems(); toast({ title: "Item deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" })
    });
  };

  // ——— Categories Logic ———
  const openCreateCat = () => {
    setEditingCat(null);
    setCatForm(emptyCatForm);
    setCatOpen(true);
  };
  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name,
      image_url: cat.image ?? "",
      imageFile: null,
      imageMode: cat.image ? "url" : "none",
    });
    setCatOpen(true);
  };

  const handleSaveCat = () => {
    if (!catForm.name.trim()) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }
    const basePayload: CategoryInput = { name: catForm.name };
    let payload = basePayload;
    if (catForm.imageMode === "upload" && catForm.imageFile) payload = { ...basePayload, imageFile: catForm.imageFile };
    else if (catForm.imageMode === "url") payload = { ...basePayload, image_url: catForm.image_url };
    else payload = { ...basePayload, image_url: "" };

    if (editingCat) {
      updateCat.mutate({ id: editingCat.id, data: payload }, {
        onSuccess: () => { invalidateCats(); setCatOpen(false); toast({ title: "Category updated" }); },
        onError: (err: any) => {
          const data = err.response?.data;
          const msg = typeof data === 'object' ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(", ") : "Failed to update";
          toast({ title: "Update Failed", description: msg, variant: "destructive" });
        }
      });
    } else {
      createCat.mutate({ data: payload }, {
        onSuccess: () => { invalidateCats(); setCatOpen(false); toast({ title: "Category created" }); },
        onError: (err: any) => {
          const data = err.response?.data;
          const msg = typeof data === 'object' ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(", ") : "Failed to create";
          toast({ title: "Creation Failed", description: msg, variant: "destructive" });
        }
      });
    }
  };

  const handleDeleteCat = (id: number) => {
    if (!confirm("Delete this category? Items in this category will also be affected.")) return;
    deleteCat.mutate({ id }, {
      onSuccess: () => { invalidateCats(); invalidateItems(); toast({ title: "Category deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" })
    });
  };

  const applyExternalFood = (item: ExternalFoodResult) => {
    const matched = categories?.find(c => c.name.toLowerCase() === item.suggested_category.toLowerCase());
    setItemForm({
      ...itemForm,
      name: item.name,
      description: item.description,
      image_url: item.image_url,
      imageMode: "url",
      category_id: String(matched?.id ?? categories?.[0]?.id ?? ""),
    });
  };

  return (
    <div className="page-container py-5 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
          <h1 className="page-title">Menu Management</h1>
        </div>
        <div className="flex gap-2">
          {activeTab === "items" ? (
            <Button onClick={openCreateItem} className="flex-1 sm:flex-none">
              <Plus className="mr-2 w-4 h-4" /> Add Item
            </Button>
          ) : (
            <Button onClick={openCreateCat} className="flex-1 sm:flex-none">
              <Plus className="mr-2 w-4 h-4" /> Add Category
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="items" className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4" /> Items
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="w-4 h-4" /> Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          {itemsLoading ? (
            <p className="text-muted-foreground">Loading items...</p>
          ) : (
            <div className="bg-card border border-card-border rounded-2xl overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[40rem]">
                <thead className="bg-muted/50 text-sm text-muted-foreground">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold">Item</th>
                    <th className="text-left px-6 py-4 font-semibold">Category</th>
                    <th className="text-left px-6 py-4 font-semibold">Type</th>
                    <th className="text-left px-6 py-4 font-semibold">Price</th>
                    <th className="text-left px-6 py-4 font-semibold">Status</th>
                    <th className="text-right px-6 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items?.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors text-sm">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                            {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🍽️</div>}
                          </div>
                          <span className="font-medium line-clamp-1">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{item.category?.name ?? "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.food_type === "veg" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {item.food_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">₹{item.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.is_available ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {item.is_available ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditItem(item)}><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items?.length === 0 && <div className="text-center py-12 text-muted-foreground">No menu items found.</div>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories">
          {catsLoading ? (
            <p className="text-muted-foreground">Loading categories...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories?.map((cat) => (
                <div key={cat.id} className="bg-card border border-card-border rounded-xl p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border">
                      {cat.image ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">📁</div>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{cat.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">ID: {cat.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCat(cat)}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteCat(cat.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
              {categories?.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No categories found.</div>}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemOpen}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90dvh] flex flex-col">
          <DialogHeader><DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
            {!editingItem && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="w-4 h-4" /> Search food database</div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={foodSearch} onChange={(e) => setFoodSearch(e.target.value)} placeholder="e.g. Biryani, Chicken..." className="pl-9" />
                </div>
                {externalResults && externalResults.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {externalResults.map(res => (
                      <button key={res.external_id} type="button" onClick={() => applyExternalFood(res)} className="w-full flex items-center gap-3 p-2 rounded-lg border bg-card hover:border-primary text-left transition-colors">
                        <img src={res.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                        <span className="flex-1 text-xs font-medium line-clamp-1">{res.name}</span>
                        <span className="text-[10px] font-bold text-primary">USE</span>
                      </button>
                    ))}
                  </div>
                )}
                <Separator />
              </div>
            )}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} placeholder="Item name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input type="number" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={itemForm.category_id} onValueChange={v => setItemForm({...itemForm, category_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Daily Stock</Label>
                <Input type="number" value={itemForm.default_stock} onChange={e => setItemForm({...itemForm, default_stock: e.target.value})} placeholder="e.g. 10" />
              </div>
              <div className="space-y-2">
                <Label>Current Stock</Label>
                <Input type="number" value={itemForm.current_stock} onChange={e => setItemForm({...itemForm, current_stock: e.target.value})} placeholder="e.g. 10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={itemForm.food_type} onValueChange={v => setItemForm({...itemForm, food_type: v as "veg" | "nonveg"})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="veg">Veg</SelectItem><SelectItem value="nonveg">Non-Veg</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Availability</Label>
                <Select value={itemForm.is_available ? "yes" : "no"} onValueChange={v => setItemForm({...itemForm, is_available: v === "yes"})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Available</SelectItem><SelectItem value="no">Unavailable</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Image</Label>
              <div className="grid grid-cols-3 gap-2">
                {[{m:"none", l:"None", i:ImageOff}, {m:"url", l:"URL", i:Link2}, {m:"upload", l:"File", i:Upload}].map(x => (
                  <button key={x.m} type="button" onClick={() => setItemForm({...itemForm, imageMode: x.m as ImageMode, imageFile: null})} className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-bold uppercase transition-colors ${itemForm.imageMode === x.m ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                    <x.i className="w-4 h-4" />{x.l}
                  </button>
                ))}
              </div>
              {itemForm.imageMode === "url" && <Input value={itemForm.image_url} onChange={e => setItemForm({...itemForm, image_url: e.target.value})} placeholder="Image URL" />}
              {itemForm.imageMode === "upload" && <Input type="file" onChange={e => setItemForm({...itemForm, imageFile: e.target.files?.[0] ?? null})} />}
            </div>
          </div>
          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => setItemOpen(false)} disabled={createItem.isPending || updateItem.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem} disabled={createItem.isPending || updateItem.isPending}>
              {(createItem.isPending || updateItem.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? "Update Item" : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatOpen}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)]">
          <DialogHeader><DialogTitle>{editingCat ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} placeholder="e.g. Starters, Main Course" />
            </div>
            <div className="space-y-3">
              <Label>Image</Label>
              <div className="grid grid-cols-3 gap-2">
                {[{m:"none", l:"None", i:ImageOff}, {m:"url", l:"URL", i:Link2}, {m:"upload", l:"File", i:Upload}].map(x => (
                  <button key={x.m} type="button" onClick={() => setCatForm({...catForm, imageMode: x.m as ImageMode, imageFile: null})} className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-bold uppercase transition-colors ${catForm.imageMode === x.m ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                    <x.i className="w-4 h-4" />{x.l}
                  </button>
                ))}
              </div>
              {catForm.imageMode === "url" && <Input value={catForm.image_url} onChange={e => setCatForm({...catForm, image_url: e.target.value})} placeholder="Image URL" />}
              {catForm.imageMode === "upload" && <Input type="file" onChange={e => setCatForm({...catForm, imageFile: e.target.files?.[0] ?? null})} />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)} disabled={createCat.isPending || updateCat.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSaveCat} disabled={createCat.isPending || updateCat.isPending}>
              {(createCat.isPending || updateCat.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCat ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
