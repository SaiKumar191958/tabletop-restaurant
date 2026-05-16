import { useState } from "react";
import {
  useListMenuItems,
  useListCategories,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  getListMenuItemsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, UtensilsCrossed } from "lucide-react";
import type { FoodItem } from "@workspace/api-client-react";

type FoodItemType = FoodItem;

const emptyForm = { name: "", description: "", price: "", food_type: "veg" as "veg" | "nonveg", is_available: true, category_id: "", image: "" };

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

  const invalidate = () => qc.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (item: FoodItemType) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      food_type: item.food_type as "veg" | "nonveg",
      is_available: item.is_available,
      category_id: String(item.category_id),
      image: item.image ?? "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    const payload = {
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price),
      food_type: form.food_type,
      is_available: form.is_available,
      category_id: Number(form.category_id),
      image: form.image || undefined,
    };

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold">Manage Menu</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 w-4 h-4" /> Add Item
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          <table className="w-full">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
            <div className="space-y-2">
              <Label>Image URL (optional)</Label>
              <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
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
