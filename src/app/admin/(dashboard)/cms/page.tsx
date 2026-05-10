"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Loader2,
  UploadCloud,
  Plus,
  GripVertical,
  Trash2,
  Edit2,
  CheckCircle2,
} from "lucide-react";

const TABS = [
  { id: "banners", label: "Hero Banners" },
  { id: "sections", label: "Sections Toggle" },
  { id: "collections", label: "Featured Collections" },
  { id: "flash_sale", label: "Flash Sale" },
  { id: "occasions", label: "Occasions" },
  { id: "trust_badges", label: "Trust Badges" },
  { id: "about", label: "About Page" },
  { id: "announcement", label: "Announcement Bar" },
];

const EMOJI_GRID = [
  "✨",
  "🔒",
  "🚚",
  "↩️",
  "🌿",
  "💯",
  "⭐",
  "🌟",
  "❤️",
  "👗",
  "🧵",
  "🎁",
  "💎",
  "🏆",
  "👑",
  "✅",
  "🔥",
  "⚡",
  "🎉",
  "🇮🇳",
];

type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  cta_text?: string;
  cta_url?: string;
  image_url: string;
  mobile_image_url?: string;
  position: string;
  sort_order: number;
  is_active: boolean;
  starts_at?: string;
  ends_at?: string;
};

export default function CMSPage() {
  const [activeTab, setActiveTab] = useState("banners");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // States for each section
  const [banners, setBanners] = useState<Banner[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [occasions, setOccasions] = useState<any[]>([]);
  const [trustBadges, setTrustBadges] = useState<any[]>([]);
  const [aboutPage, setAboutPage] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  // Form states
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [editingFlashSale, setEditingFlashSale] = useState<any>(null);
  const [editingOccasion, setEditingOccasion] = useState<any>(null);
  const [editingTrustBadge, setEditingTrustBadge] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "banners") {
        try {
          const res = await fetch("/api/admin/cms/banners");
          if (!res.ok) throw new Error(`Banners request failed ${res.status}`);
          const data = await res.json();
          setBanners(
            Array.isArray(data) ? data : (data?.banners ?? data?.data ?? []),
          );
        } catch (err) {
          console.error("CMS banners fetch failed:", err);
          toast.error("Failed to load banners");
          setBanners([]);
        }
      } else if (activeTab === "sections" || activeTab === "announcement") {
        try {
          const res = await fetch("/api/admin/cms/sections");
          if (!res.ok) throw new Error(`Sections request failed ${res.status}`);
          const data = await res.json();
          setSections(
            Array.isArray(data) ? data : (data?.sections ?? data?.data ?? []),
          );
        } catch (err) {
          console.error("CMS sections fetch failed:", err);
          toast.error("Failed to load sections");
          setSections([]);
        }

        if (activeTab === "announcement") {
          try {
            const sRes = await fetch("/api/admin/settings");
            if (!sRes.ok)
              throw new Error(`Settings request failed ${sRes.status}`);
            setSettings(await sRes.json());
          } catch (err) {
            console.error("CMS settings fetch failed:", err);
            toast.error("Failed to load settings");
            setSettings(null);
          }
        }
      } else if (activeTab === "collections") {
        try {
          const res = await fetch("/api/admin/cms/collections");
          if (!res.ok)
            throw new Error(`Collections request failed ${res.status}`);
          const data = await res.json();
          setCollections(
            Array.isArray(data)
              ? data
              : (data?.collections ?? data?.data ?? []),
          );
        } catch (err) {
          console.error("CMS collections fetch failed:", err);
          toast.error("Failed to load collections");
          setCollections([]);
        }
      } else if (activeTab === "flash_sale") {
        try {
          const res = await fetch("/api/admin/cms/flash-sale");
          if (!res.ok)
            throw new Error(`Flash sale request failed ${res.status}`);
          const data = await res.json();
          setFlashSales(
            Array.isArray(data) ? data : (data?.flashSales ?? data?.data ?? []),
          );
        } catch (err) {
          console.error("CMS flash sale fetch failed:", err);
          toast.error("Failed to load flash sale data");
          setFlashSales([]);
        }
      } else if (activeTab === "occasions") {
        try {
          const res = await fetch("/api/admin/cms/occasions");
          if (!res.ok)
            throw new Error(`Occasions request failed ${res.status}`);
          const data = await res.json();
          setOccasions(
            Array.isArray(data) ? data : (data?.occasions ?? data?.data ?? []),
          );
        } catch (err) {
          console.error("CMS occasions fetch failed:", err);
          toast.error("Failed to load occasions");
          setOccasions([]);
        }
      } else if (activeTab === "trust_badges") {
        try {
          const res = await fetch("/api/admin/cms/trust-badges");
          if (!res.ok)
            throw new Error(`Trust badges request failed ${res.status}`);
          const data = await res.json();
          setTrustBadges(
            Array.isArray(data)
              ? data
              : (data?.trustBadges ?? data?.data ?? []),
          );
        } catch (err) {
          console.error("CMS trust badges fetch failed:", err);
          toast.error("Failed to load trust badges");
          setTrustBadges([]);
        }
      } else if (activeTab === "about") {
        try {
          const res = await fetch("/api/admin/cms/about");
          if (!res.ok) throw new Error(`About request failed ${res.status}`);
          setAboutPage(await res.json());
        } catch (err) {
          console.error("CMS about fetch failed:", err);
          toast.error("Failed to load about page");
          setAboutPage(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const uploadCloudinary = (onSuccess: (url: string) => void) => {
    if (typeof window !== "undefined" && (window as any).cloudinary) {
      (window as any).cloudinary.openUploadWidget(
        {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          uploadPreset: "ml_default",
          multiple: false,
        },
        (error: any, result: any) => {
          if (!error && result && result.event === "success") {
            onSuccess(result.info.secure_url);
          }
        },
      );
    } else {
      toast.error("Cloudinary widget not loaded");
    }
  };

  // Drag and drop helper
  const handleDragStart = (e: any, index: number) => {
    e.dataTransfer.setData("dragIndex", index);
  };

  const handleDrop = async (
    e: any,
    index: number,
    items: any[],
    endpoint: string,
    setFn: any,
    isSectionReorder = false,
  ) => {
    const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"));
    if (dragIndex === index) return;
    const newItems = [...items];
    const [removed] = newItems.splice(dragIndex, 1);
    newItems.splice(index, 0, removed);
    setFn(newItems);

    try {
      if (isSectionReorder) {
        await fetch(endpoint, {
          method: "PUT",
          body: JSON.stringify({
            sections: newItems.map((s, i) => ({ id: s.id, sort_order: i })),
          }),
        });
      } else {
        await fetch(endpoint, {
          method: "PUT",
          body: JSON.stringify({ ids: newItems.map((i) => i.id) }),
        });
      }
      toast.success("Reordered successfully");
    } catch {
      toast.error("Reorder failed");
      fetchData(); // revert
    }
  };

  // --- RENDERS ---

  const renderBannersTab = () => {
    if (editingBanner) {
      return (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            const method = editingBanner.id ? "PATCH" : "POST";
            const url = editingBanner.id
              ? `/api/admin/cms/banners/${editingBanner.id}`
              : "/api/admin/cms/banners";
            const res = await fetch(url, {
              method,
              body: JSON.stringify(editingBanner),
            });
            setSaving(false);
            if (res.ok) {
              toast.success("Saved");
              setEditingBanner(null);
              fetchData();
            } else toast.error("Error saving");
          }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingBanner.id ? "Edit Banner" : "New Banner"}
            </h2>
            <button
              type="button"
              onClick={() => setEditingBanner(null)}
              className="text-sm text-[#5a7060]"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Title *</label>
              <input
                required
                value={editingBanner.title || ""}
                onChange={(e) =>
                  setEditingBanner({ ...editingBanner, title: e.target.value })
                }
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Subtitle</label>
              <input
                value={editingBanner.subtitle || ""}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    subtitle: e.target.value,
                  })
                }
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">CTA Text</label>
              <input
                value={editingBanner.cta_text || ""}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    cta_text: e.target.value,
                  })
                }
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">CTA URL</label>
              <input
                value={editingBanner.cta_url || ""}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    cta_url: e.target.value,
                  })
                }
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Desktop Image URL *</label>
              <div className="flex gap-2">
                <input
                  required
                  value={editingBanner.image_url || ""}
                  onChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      image_url: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() =>
                    uploadCloudinary((url) =>
                      setEditingBanner({ ...editingBanner, image_url: url }),
                    )
                  }
                  className="bg-gray-100 px-3 rounded hover:bg-gray-200"
                >
                  <UploadCloud className="w-4 h-4" />
                </button>
              </div>
              {editingBanner.image_url && (
                <img
                  src={editingBanner.image_url}
                  className="mt-2 h-20 object-cover rounded"
                />
              )}
            </div>
            <div>
              <label className="block text-sm mb-1">
                Mobile Image URL (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  value={editingBanner.mobile_image_url || ""}
                  onChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      mobile_image_url: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() =>
                    uploadCloudinary((url) =>
                      setEditingBanner({
                        ...editingBanner,
                        mobile_image_url: url,
                      }),
                    )
                  }
                  className="bg-gray-100 px-3 rounded hover:bg-gray-200"
                >
                  <UploadCloud className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Position</label>
              <select
                value={editingBanner.position || "hero"}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    position: e.target.value,
                  })
                }
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
              >
                <option value="hero">Hero</option>
                <option value="promotional">Promotional</option>
              </select>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <label className="flex items-center gap-2">
                <Switch
                  checked={editingBanner.is_active !== false}
                  onCheckedChange={(v) =>
                    setEditingBanner({ ...editingBanner, is_active: v })
                  }
                />
                Active
              </label>
            </div>
          </div>
          <button
            disabled={saving}
            className="bg-[#c9a84c] text-[#ffffff] font-bold px-6 py-2 rounded mt-4"
          >
            {saving ? "Saving..." : "Save Banner"}
          </button>
        </form>
      );
    }

    return (
      <div className="space-y-4">
        <button
          onClick={() =>
            setEditingBanner({ is_active: true, position: "hero" })
          }
          className="flex items-center gap-2 bg-[#c9a84c] text-[#ffffff] px-4 py-2 rounded font-bold"
        >
          <Plus className="w-4 h-4" /> Add Banner
        </button>
        <div className="border border-[#e8e2d6] rounded-lg overflow-hidden">
          {(Array.isArray(banners) ? banners : []).map((b, i) => (
            <div
              key={b.id}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) =>
                handleDrop(
                  e,
                  i,
                  banners,
                  "/api/admin/cms/banners/0",
                  setBanners,
                )
              }
              className="flex items-center p-3 border-b border-white/5 hover:bg-white/5 bg-white"
            >
              <GripVertical className="w-5 h-5 text-[#9aab9e] mr-3 cursor-move" />
              <img
                src={b.image_url}
                className="w-12 h-12 object-cover rounded mr-4 bg-white/10"
              />
              <div className="flex-1">
                <p className="font-bold">{b.title}</p>
                <p className="text-xs text-[#5a7060]">{b.position}</p>
              </div>
              <div className="mr-6">
                {b.is_active ? (
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                    Active
                  </span>
                ) : (
                  <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">
                    Inactive
                  </span>
                )}
              </div>
              <button
                onClick={() => setEditingBanner(b)}
                className="p-2 hover:text-[#c9a84c]"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={async () => {
                  if (confirm("Delete banner?")) {
                    await fetch(`/api/admin/cms/banners/${b.id}`, {
                      method: "DELETE",
                    });
                    fetchData();
                  }
                }}
                className="p-2 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSectionsTab = () => {
    if (editingSection) {
      return (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            const res = await fetch("/api/admin/cms/sections", {
              method: "PATCH",
              body: JSON.stringify(editingSection),
            });
            setSaving(false);
            if (res.ok) {
              toast.success("Saved");
              setEditingSection(null);
              fetchData();
            } else toast.error("Error saving");
          }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Edit Section: {editingSection.section_key}
            </h2>
            <button
              type="button"
              onClick={() => setEditingSection(null)}
              className="text-sm text-[#5a7060]"
            >
              Cancel
            </button>
          </div>
          <div className="grid gap-4">
            {[
              "announcement_bar",
              "featured_collections",
              "new_arrivals",
              "shop_by_occasion",
              "trust_badges",
              "about_preview",
              "newsletter",
            ].includes(editingSection.section_key) && (
              <div>
                <label className="block text-sm mb-1">Title</label>
                <input
                  value={editingSection.title || ""}
                  onChange={(e) =>
                    setEditingSection({
                      ...editingSection,
                      title: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
                />
              </div>
            )}
            {["featured_collections", "new_arrivals", "newsletter"].includes(
              editingSection.section_key,
            ) && (
              <div>
                <label className="block text-sm mb-1">Subtitle</label>
                <input
                  value={editingSection.subtitle || ""}
                  onChange={(e) =>
                    setEditingSection({
                      ...editingSection,
                      subtitle: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
                />
              </div>
            )}
            {editingSection.section_key === "about_preview" && (
              <>
                <div>
                  <label className="block text-sm mb-1">Body Text</label>
                  <textarea
                    rows={4}
                    value={editingSection.body || ""}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        body: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Image URL</label>
                  <div className="flex gap-2">
                    <input
                      value={editingSection.image_url || ""}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          image_url: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        uploadCloudinary((url) =>
                          setEditingSection({
                            ...editingSection,
                            image_url: url,
                          }),
                        )
                      }
                      className="bg-gray-100 px-3 rounded hover:bg-gray-200"
                    >
                      <UploadCloud className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">CTA Text</label>
                  <input
                    value={editingSection.cta_text || ""}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        cta_text: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">CTA URL</label>
                  <input
                    value={editingSection.cta_url || ""}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        cta_url: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
                  />
                </div>
              </>
            )}
          </div>
          <button
            disabled={saving}
            className="bg-[#c9a84c] text-[#ffffff] font-bold px-6 py-2 rounded mt-4"
          >
            {saving ? "Saving..." : "Save Section"}
          </button>
        </form>
      );
    }

    return (
      <div className="border border-[#e8e2d6] rounded-lg overflow-hidden">
        {(Array.isArray(sections) ? sections : []).map((s, i) => (
          <div
            key={s.id}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) =>
              handleDrop(
                e,
                i,
                sections,
                "/api/admin/cms/sections/reorder",
                setSections,
                true,
              )
            }
            className="flex items-center p-4 border-b border-white/5 hover:bg-white/5 bg-white"
          >
            <GripVertical className="w-5 h-5 text-[#9aab9e] mr-3 cursor-move" />
            <div className="flex-1">
              <p className="font-bold">
                {s.section_key
                  .split("_")
                  .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Switch
                checked={s.is_active}
                onCheckedChange={async (v) => {
                  const newSections = [...sections];
                  newSections[i].is_active = v;
                  setSections(newSections);
                  await fetch("/api/admin/cms/sections", {
                    method: "PATCH",
                    body: JSON.stringify({
                      section_key: s.section_key,
                      is_active: v,
                    }),
                  });
                }}
              />
              <button
                onClick={() => setEditingSection(s)}
                className="p-2 hover:text-[#c9a84c]"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCollectionsTab = () => {
    const featured = collections
      .filter((c) => c.is_featured)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const unfeatured = collections.filter((c) => !c.is_featured);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold mb-4">All Collections</h3>
          <div className="border border-[#e8e2d6] rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto">
            {(Array.isArray(unfeatured) ? unfeatured : []).length > 0 ? (
              (Array.isArray(unfeatured) ? unfeatured : []).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 border-b border-white/5 hover:bg-white/5"
                >
                  <span className="text-sm">{c.name}</span>
                  <button
                    onClick={async () => {
                      await fetch("/api/admin/cms/collections", {
                        method: "PATCH",
                        body: JSON.stringify({ id: c.id, is_featured: true }),
                      });
                      fetchData();
                    }}
                    className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20"
                  >
                    Feature &rarr;
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-[#5a7060]">
                No collections available yet. Create or activate a collection to
                feature it on the homepage.
              </div>
            )}
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-4 text-[#c9a84c]">
            Featured on Homepage
          </h3>
          <div className="border border-[#e8e2d6] rounded-lg overflow-hidden">
            {(Array.isArray(featured) ? featured : []).length > 0
              ? (Array.isArray(featured) ? featured : []).map((c, i) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) =>
                      handleDrop(
                        e,
                        i,
                        featured,
                        "/api/admin/cms/collections",
                        () => {
                          // locally update order
                          const newFeatured = [...featured];
                          const [removed] = newFeatured.splice(i, 1);
                          newFeatured.splice(i, 0, removed);
                          const all = [...collections];
                          // merge logic is tricky, just rely on fetch
                          fetchData();
                        },
                      )
                    }
                    className="p-3 border-b border-white/5 bg-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <GripVertical className="w-4 h-4 text-[#9aab9e] mr-2 cursor-move" />
                        <span className="font-bold text-sm">{c.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setEditingCollection(
                              editingCollection?.id === c.id ? null : c,
                            )
                          }
                          className="text-xs text-blue-400 hover:underline"
                        >
                          Edit Display
                        </button>
                        <button
                          onClick={async () => {
                            await fetch("/api/admin/cms/collections", {
                              method: "PATCH",
                              body: JSON.stringify({
                                id: c.id,
                                is_featured: false,
                              }),
                            });
                            fetchData();
                          }}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {editingCollection?.id === c.id && (
                      <div className="mt-3 bg-black/40 p-3 rounded space-y-3">
                        <div>
                          <label className="block text-xs mb-1">
                            Banner Image URL
                          </label>
                          <div className="flex gap-2">
                            <input
                              value={editingCollection.banner_image_url || ""}
                              onChange={(e) =>
                                setEditingCollection({
                                  ...editingCollection,
                                  banner_image_url: e.target.value,
                                })
                              }
                              className="w-full bg-white/5 border border-[#e8e2d6] rounded p-1 text-xs"
                            />
                            <button
                              onClick={() =>
                                uploadCloudinary((url) =>
                                  setEditingCollection({
                                    ...editingCollection,
                                    banner_image_url: url,
                                  }),
                                )
                              }
                              className="bg-white/10 px-2 rounded text-xs"
                            >
                              <UploadCloud className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs mb-1">Subtitle</label>
                          <input
                            value={editingCollection.subtitle || ""}
                            onChange={(e) =>
                              setEditingCollection({
                                ...editingCollection,
                                subtitle: e.target.value,
                              })
                            }
                            className="w-full bg-white/5 border border-[#e8e2d6] rounded p-1 text-xs"
                          />
                        </div>
                        <button
                          onClick={async () => {
                            await fetch("/api/admin/cms/collections", {
                              method: "PATCH",
                              body: JSON.stringify({
                                id: c.id,
                                banner_image_url:
                                  editingCollection.banner_image_url,
                                subtitle: editingCollection.subtitle,
                              }),
                            });
                            toast.success("Saved");
                            setEditingCollection(null);
                            fetchData();
                          }}
                          className="text-xs bg-[#c9a84c] text-black px-3 py-1 rounded font-bold"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                ))
              : null}
          </div>
        </div>
      </div>
    );
  };

  const renderFlashSaleTab = () => {
    if (editingFlashSale) {
      const formatDateForInput = (d: string) =>
        d ? new Date(d).toISOString().slice(0, 16) : "";
      return (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            const method = editingFlashSale.id ? "PATCH" : "POST";
            const res = await fetch("/api/admin/cms/flash-sale", {
              method,
              body: JSON.stringify(editingFlashSale),
            });
            setSaving(false);
            if (res.ok) {
              toast.success("Saved");
              setEditingFlashSale(null);
              fetchData();
            } else toast.error("Error saving");
          }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingFlashSale.id ? "Edit Flash Sale" : "New Flash Sale"}
            </h2>
            <button
              type="button"
              onClick={() => setEditingFlashSale(null)}
              className="text-sm text-[#5a7060]"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Title *</label>
              <input
                required
                value={editingFlashSale.title || ""}
                onChange={(e) =>
                  setEditingFlashSale({
                    ...editingFlashSale,
                    title: e.target.value,
                  })
                }
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Discount % *</label>
              <input
                required
                type="number"
                min="1"
                max="99"
                value={editingFlashSale.discount_percent || ""}
                onChange={(e) =>
                  setEditingFlashSale({
                    ...editingFlashSale,
                    discount_percent: Number(e.target.value),
                  })
                }
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Start Date & Time *</label>
              <input
                required
                type="datetime-local"
                value={formatDateForInput(editingFlashSale.starts_at)}
                onChange={(e) =>
                  setEditingFlashSale({
                    ...editingFlashSale,
                    starts_at: new Date(e.target.value).toISOString(),
                  })
                }
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">End Date & Time *</label>
              <input
                required
                type="datetime-local"
                value={formatDateForInput(editingFlashSale.ends_at)}
                onChange={(e) =>
                  setEditingFlashSale({
                    ...editingFlashSale,
                    ends_at: new Date(e.target.value).toISOString(),
                  })
                }
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900 [color-scheme:dark]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm mb-1">
                Banner Image URL (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  value={editingFlashSale.banner_image_url || ""}
                  onChange={(e) =>
                    setEditingFlashSale({
                      ...editingFlashSale,
                      banner_image_url: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() =>
                    uploadCloudinary((url) =>
                      setEditingFlashSale({
                        ...editingFlashSale,
                        banner_image_url: url,
                      }),
                    )
                  }
                  className="bg-gray-100 px-3 rounded hover:bg-gray-200"
                >
                  <UploadCloud className="w-4 h-4" />
                </button>
              </div>
              {editingFlashSale.banner_image_url && (
                <img
                  src={editingFlashSale.banner_image_url}
                  className="mt-2 h-20 object-cover rounded"
                />
              )}
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <Switch
                  checked={editingFlashSale.is_active !== false}
                  onCheckedChange={(v) =>
                    setEditingFlashSale({ ...editingFlashSale, is_active: v })
                  }
                />
                Active Status
              </label>
              <p className="text-xs text-[#5a7060] mt-2">
                Note: Discount % applies for display only. Link to a coupon code
                for actual discount at checkout.
              </p>
            </div>
          </div>
          <button
            disabled={saving}
            className="bg-[#c9a84c] text-[#ffffff] font-bold px-6 py-2 rounded mt-4"
          >
            {saving ? "Saving..." : "Save Flash Sale"}
          </button>
        </form>
      );
    }

    const active = flashSales.find((f) => f.is_active);
    const past = flashSales.filter((f) => !f.is_active);

    return (
      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Active Flash Sale</h3>
            <button
              onClick={() => setEditingFlashSale({ is_active: true })}
              className="flex items-center gap-2 bg-[#c9a84c] text-[#ffffff] px-4 py-2 rounded font-bold text-sm"
            >
              <Plus className="w-4 h-4" /> Create Sale
            </button>
          </div>
          {active ? (
            <div className="bg-gradient-to-r from-red-900/50 to-[#c9a84c]/20 border border-[#c9a84c]/30 rounded-lg p-6 flex justify-between items-center">
              <div>
                <h4 className="text-2xl font-bold text-white mb-1">
                  ⚡ {active.title} — {active.discount_percent}% OFF
                </h4>
                <p className="text-sm text-[#5a7060]">
                  Ends: {new Date(active.ends_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingFlashSale(active)}
                  className="bg-white/10 px-4 py-2 rounded font-bold hover:bg-white/20 transition"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    await fetch("/api/admin/cms/flash-sale", {
                      method: "PATCH",
                      body: JSON.stringify({ id: active.id, is_active: false }),
                    });
                    fetchData();
                  }}
                  className="bg-red-500/20 text-red-400 px-4 py-2 rounded font-bold hover:bg-red-500/40 transition"
                >
                  Deactivate
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-[#e8e2d6] rounded-lg p-8 text-center text-[#5a7060]">
              No active flash sale
            </div>
          )}
        </div>

        {past.length > 0 && (
          <div>
            <h3 className="font-bold text-lg mb-4 text-[#5a7060]">Past Sales</h3>
            <div className="border border-[#e8e2d6] rounded-lg overflow-hidden">
              {(Array.isArray(past) ? past : []).map((f) => (
                <div
                  key={f.id}
                  className="flex justify-between p-3 border-b border-white/5 text-sm text-[#5a7060]"
                >
                  <span>
                    {f.title} ({f.discount_percent}%)
                  </span>
                  <div className="flex gap-4">
                    <span>
                      Ended: {new Date(f.ends_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={async () => {
                        if (confirm("Delete record?")) {
                          await fetch(`/api/admin/cms/flash-sale?id=${f.id}`, {
                            method: "DELETE",
                          });
                          fetchData();
                        }
                      }}
                      className="hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOccasionsTab = () => {
    if (editingOccasion) {
      return (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            const method = editingOccasion.id ? "PATCH" : "POST";
            const res = await fetch("/api/admin/cms/occasions", {
              method,
              body: JSON.stringify(editingOccasion),
            });
            setSaving(false);
            if (res.ok) {
              toast.success("Saved");
              setEditingOccasion(null);
              fetchData();
            } else toast.error("Error saving");
          }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingOccasion.id ? "Edit Occasion" : "New Occasion"}
            </h2>
            <button
              type="button"
              onClick={() => setEditingOccasion(null)}
              className="text-sm text-[#5a7060]"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Name *</label>
              <input
                required
                value={editingOccasion.name || ""}
                onChange={(e) => {
                  const name = e.target.value;
                  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  setEditingOccasion({
                    ...editingOccasion,
                    name,
                    slug: editingOccasion.id ? editingOccasion.slug : slug,
                  });
                }}
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Slug *</label>
              <input
                required
                value={editingOccasion.slug || ""}
                onChange={(e) =>
                  setEditingOccasion({
                    ...editingOccasion,
                    slug: e.target.value,
                  })
                }
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Link URL</label>
              <input
                value={editingOccasion.link_url || ""}
                onChange={(e) =>
                  setEditingOccasion({
                    ...editingOccasion,
                    link_url: e.target.value,
                  })
                }
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
                placeholder="/products?occasion=slug"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Image URL</label>
              <div className="flex gap-2">
                <input
                  value={editingOccasion.image_url || ""}
                  onChange={(e) =>
                    setEditingOccasion({
                      ...editingOccasion,
                      image_url: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() =>
                    uploadCloudinary((url) =>
                      setEditingOccasion({
                        ...editingOccasion,
                        image_url: url,
                      }),
                    )
                  }
                  className="bg-gray-100 px-3 rounded hover:bg-gray-200"
                >
                  <UploadCloud className="w-4 h-4" />
                </button>
              </div>
              {editingOccasion.image_url && (
                <img
                  src={editingOccasion.image_url}
                  className="mt-2 w-12 h-12 rounded-full object-cover"
                />
              )}
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <Switch
                  checked={editingOccasion.is_active !== false}
                  onCheckedChange={(v) =>
                    setEditingOccasion({ ...editingOccasion, is_active: v })
                  }
                />
                Active
              </label>
            </div>
          </div>
          <button
            disabled={saving}
            className="bg-[#c9a84c] text-[#ffffff] font-bold px-6 py-2 rounded mt-4"
          >
            {saving ? "Saving..." : "Save Occasion"}
          </button>
        </form>
      );
    }

    return (
      <div className="space-y-4">
        <button
          onClick={() => setEditingOccasion({ is_active: true })}
          className="flex items-center gap-2 bg-[#c9a84c] text-[#ffffff] px-4 py-2 rounded font-bold"
        >
          <Plus className="w-4 h-4" /> Add Occasion
        </button>
        <div className="border border-[#e8e2d6] rounded-lg overflow-hidden">
          {(Array.isArray(occasions) ? occasions : []).length > 0 ? (
            (Array.isArray(occasions) ? occasions : []).map((o, i) => (
              <div
                key={o.id}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) =>
                  handleDrop(
                    e,
                    i,
                    occasions,
                    "/api/admin/cms/occasions",
                    setOccasions,
                  )
                }
                className="flex items-center p-3 border-b border-white/5 hover:bg-white/5 bg-white"
              >
                <GripVertical className="w-5 h-5 text-[#9aab9e] mr-3 cursor-move" />
                {o.image_url ? (
                  <img
                    src={o.image_url}
                    className="w-10 h-10 object-cover rounded-full mr-4"
                  />
                ) : (
                  <div className="w-10 h-10 bg-white/10 rounded-full mr-4 flex items-center justify-center">
                    ✨
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold">{o.name}</p>
                  <p className="text-xs text-[#5a7060]">{o.link_url}</p>
                </div>
                <div className="mr-6">
                  <Switch
                    checked={o.is_active}
                    onCheckedChange={async (v) => {
                      await fetch("/api/admin/cms/occasions", {
                        method: "PATCH",
                        body: JSON.stringify({ id: o.id, is_active: v }),
                      });
                      fetchData();
                    }}
                  />
                </div>
                <button
                  onClick={() => setEditingOccasion(o)}
                  className="p-2 hover:text-[#c9a84c]"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    if (confirm("Delete?")) {
                      await fetch(`/api/admin/cms/occasions?id=${o.id}`, {
                        method: "DELETE",
                      });
                      fetchData();
                    }
                  }}
                  className="p-2 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-[#5a7060]">
              No occasions found yet. Add a new occasion to show it in the
              storefront grid.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTrustBadgesTab = () => {
    if (editingTrustBadge) {
      return (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            const method = editingTrustBadge.id ? "PATCH" : "POST";
            const res = await fetch("/api/admin/cms/trust-badges", {
              method,
              body: JSON.stringify(editingTrustBadge),
            });
            setSaving(false);
            if (res.ok) {
              toast.success("Saved");
              setEditingTrustBadge(null);
              fetchData();
            } else toast.error("Error saving");
          }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingTrustBadge.id ? "Edit Badge" : "New Badge"}
            </h2>
            <button
              type="button"
              onClick={() => setEditingTrustBadge(null)}
              className="text-sm text-[#5a7060]"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm mb-1">Icon (Emoji) *</label>
              <input
                required
                value={editingTrustBadge.icon || ""}
                onChange={(e) =>
                  setEditingTrustBadge({
                    ...editingTrustBadge,
                    icon: e.target.value,
                  })
                }
                className="w-20 text-3xl text-center bg-white border border-gray-300 rounded p-2 text-gray-900 mb-2"
              />
              <div className="flex flex-wrap gap-2">
                {EMOJI_GRID.map((em) => (
                  <button
                    type="button"
                    key={em}
                    onClick={() =>
                      setEditingTrustBadge({ ...editingTrustBadge, icon: em })
                    }
                    className="text-xl hover:bg-white/10 p-1 rounded"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Title *</label>
              <input
                required
                value={editingTrustBadge.title || ""}
                onChange={(e) =>
                  setEditingTrustBadge({
                    ...editingTrustBadge,
                    title: e.target.value,
                  })
                }
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Subtitle</label>
              <input
                value={editingTrustBadge.subtitle || ""}
                onChange={(e) =>
                  setEditingTrustBadge({
                    ...editingTrustBadge,
                    subtitle: e.target.value,
                  })
                }
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <Switch
                  checked={editingTrustBadge.is_active !== false}
                  onCheckedChange={(v) =>
                    setEditingTrustBadge({ ...editingTrustBadge, is_active: v })
                  }
                />
                Active
              </label>
            </div>
          </div>
          <button
            disabled={saving}
            className="bg-[#c9a84c] text-[#ffffff] font-bold px-6 py-2 rounded mt-4"
          >
            {saving ? "Saving..." : "Save Badge"}
          </button>
        </form>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <button
            onClick={() =>
              setEditingTrustBadge({ is_active: true, icon: "✨" })
            }
            className="flex items-center gap-2 bg-[#c9a84c] text-[#ffffff] px-4 py-2 rounded font-bold"
          >
            <Plus className="w-4 h-4" /> Add Badge
          </button>
          <p className="text-[#5a7060] text-sm">
            Recommended: exactly 4 badges for optimal grid.
          </p>
        </div>
        <div className="border border-[#e8e2d6] rounded-lg overflow-hidden">
          {(Array.isArray(trustBadges) ? trustBadges : []).length > 0 ? (
            (Array.isArray(trustBadges) ? trustBadges : []).map((t, i) => (
              <div
                key={t.id}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) =>
                  handleDrop(
                    e,
                    i,
                    trustBadges,
                    "/api/admin/cms/trust-badges",
                    setTrustBadges,
                  )
                }
                className="flex items-center p-3 border-b border-white/5 hover:bg-white/5 bg-white"
              >
                <GripVertical className="w-5 h-5 text-[#9aab9e] mr-3 cursor-move" />
                <div className="text-3xl mr-4">{t.icon}</div>
                <div className="flex-1">
                  <p className="font-bold">{t.title}</p>
                  <p className="text-xs text-[#5a7060]">{t.subtitle}</p>
                </div>
                <div className="mr-6">
                  <Switch
                    checked={t.is_active}
                    onCheckedChange={async (v) => {
                      await fetch("/api/admin/cms/trust-badges", {
                        method: "PATCH",
                        body: JSON.stringify({ id: t.id, is_active: v }),
                      });
                      fetchData();
                    }}
                  />
                </div>
                <button
                  onClick={() => setEditingTrustBadge(t)}
                  className="p-2 hover:text-[#c9a84c]"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    if (confirm("Delete?")) {
                      await fetch(`/api/admin/cms/trust-badges?id=${t.id}`, {
                        method: "DELETE",
                      });
                      fetchData();
                    }
                  }}
                  className="p-2 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-[#5a7060]">
              No trust badges found yet. Add a badge to show trust messaging on
              the homepage.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAboutTab = () => {
    if (!aboutPage) return null;

    let parsedValues: any[] = [];
    try {
      parsedValues =
        typeof aboutPage.values === "string"
          ? JSON.parse(aboutPage.values)
          : aboutPage.values || [];
    } catch {}

    const handleSaveAbout = async (e: any) => {
      e.preventDefault();
      setSaving(true);
      const res = await fetch("/api/admin/cms/about", {
        method: "PATCH",
        body: JSON.stringify({
          ...aboutPage,
          values: JSON.stringify(parsedValues),
        }),
      });
      setSaving(false);
      if (res.ok) toast.success("About page saved");
      else toast.error("Save failed");
    };

    return (
      <form onSubmit={handleSaveAbout} className="space-y-8">
        <div className="space-y-4">
          <h3 className="font-bold text-lg border-b border-[#e8e2d6] pb-2 text-[#c9a84c]">
            Hero Section
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Hero Title</label>
              <input
                value={aboutPage.hero_title || ""}
                onChange={(e) =>
                  setAboutPage({ ...aboutPage, hero_title: e.target.value })
                }
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Hero Subtitle</label>
              <input
                value={aboutPage.hero_subtitle || ""}
                onChange={(e) =>
                  setAboutPage({ ...aboutPage, hero_subtitle: e.target.value })
                }
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm mb-1">
                Hero Background Image
              </label>
              <div className="flex gap-2">
                <input
                  value={aboutPage.hero_image_url || ""}
                  onChange={(e) =>
                    setAboutPage({
                      ...aboutPage,
                      hero_image_url: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() =>
                    uploadCloudinary((url) =>
                      setAboutPage({ ...aboutPage, hero_image_url: url }),
                    )
                  }
                  className="bg-gray-100 px-3 rounded hover:bg-gray-200"
                >
                  <UploadCloud className="w-4 h-4" />
                </button>
              </div>
              {aboutPage.hero_image_url && (
                <img
                  src={aboutPage.hero_image_url}
                  className="mt-2 h-32 object-cover rounded border border-[#e8e2d6]"
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-lg border-b border-[#e8e2d6] pb-2 text-[#c9a84c]">
            Story Section
          </h3>
          <div>
            <label className="block text-sm mb-1">Heading</label>
            <input
              value={aboutPage.story_heading || ""}
              onChange={(e) =>
                setAboutPage({ ...aboutPage, story_heading: e.target.value })
              }
              className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">
              Body Text (Separate paragraphs with Enter)
            </label>
            <textarea
              rows={6}
              value={aboutPage.story_body || ""}
              onChange={(e) =>
                setAboutPage({ ...aboutPage, story_body: e.target.value })
              }
              className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-lg border-b border-[#e8e2d6] pb-2 text-[#c9a84c]">
            Mission Section
          </h3>
          <div>
            <label className="block text-sm mb-1">Heading</label>
            <input
              value={aboutPage.mission_heading || ""}
              onChange={(e) =>
                setAboutPage({ ...aboutPage, mission_heading: e.target.value })
              }
              className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Body Statement</label>
            <textarea
              rows={3}
              value={aboutPage.mission_body || ""}
              onChange={(e) =>
                setAboutPage({ ...aboutPage, mission_body: e.target.value })
              }
              className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900 text-xl font-light italic"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#e8e2d6] pb-2">
            <h3 className="font-bold text-lg text-[#c9a84c]">Core Values</h3>
            <button
              type="button"
              onClick={() => {
                parsedValues.push({
                  icon: "✨",
                  title: "New Value",
                  description: "",
                });
                setAboutPage({
                  ...aboutPage,
                  values: JSON.stringify(parsedValues),
                });
              }}
              className="text-sm bg-white/10 px-3 py-1 rounded flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Value
            </button>
          </div>
          <div className="space-y-3">
            {parsedValues.map((v: any, i: number) => (
              <div
                key={i}
                className="flex gap-2 items-start bg-white/5 p-3 rounded border border-white/5"
              >
                <input
                  value={v.icon}
                  onChange={(e) => {
                    parsedValues[i].icon = e.target.value;
                    setAboutPage({
                      ...aboutPage,
                      values: JSON.stringify(parsedValues),
                    });
                  }}
                  className="w-12 text-center bg-black/20 border border-[#e8e2d6] rounded p-2 text-xl"
                />
                <div className="flex-1 space-y-2">
                  <input
                    value={v.title}
                    onChange={(e) => {
                      parsedValues[i].title = e.target.value;
                      setAboutPage({
                        ...aboutPage,
                        values: JSON.stringify(parsedValues),
                      });
                    }}
                    placeholder="Title"
                    className="w-full bg-black/20 border border-[#e8e2d6] rounded p-2 font-bold"
                  />
                  <input
                    value={v.description}
                    onChange={(e) => {
                      parsedValues[i].description = e.target.value;
                      setAboutPage({
                        ...aboutPage,
                        values: JSON.stringify(parsedValues),
                      });
                    }}
                    placeholder="Description"
                    className="w-full bg-black/20 border border-[#e8e2d6] rounded p-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    parsedValues.splice(i, 1);
                    setAboutPage({
                      ...aboutPage,
                      values: JSON.stringify(parsedValues),
                    });
                  }}
                  className="text-red-400 p-2 hover:bg-red-500/20 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          disabled={saving}
          className="bg-[#c9a84c] text-[#ffffff] font-bold px-8 py-3 rounded mt-4 w-full"
        >
          {saving ? "Saving..." : "Save About Page"}
        </button>
      </form>
    );
  };

  const renderAnnouncementTab = () => {
    if (!settings || sections.length === 0) return null;
    const annSection = sections.find(
      (s) => s.section_key === "announcement_bar",
    );
    if (!annSection) return null;

    const handleSaveAnnounce = async (e: any) => {
      e.preventDefault();
      setSaving(true);
      await fetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          announcement_bar_bg: settings.announcement_bar_bg,
          announcement_bar_text_color: settings.announcement_bar_text_color,
          announcement_bar_link: settings.announcement_bar_link,
        }),
      });
      await fetch("/api/admin/cms/sections", {
        method: "PATCH",
        body: JSON.stringify({
          section_key: "announcement_bar",
          title: annSection.title,
          is_active: annSection.is_active,
        }),
      });
      setSaving(false);
      toast.success("Announcement bar updated");
      fetchData();
    };

    return (
      <form onSubmit={handleSaveAnnounce} className="space-y-8">
        <div className="bg-white/5 border border-[#e8e2d6] rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Enable Announcement Bar</h3>
            <Switch
              checked={annSection.is_active}
              onCheckedChange={(v) => {
                const newSections = [...sections];
                const idx = newSections.findIndex(
                  (s) => s.section_key === "announcement_bar",
                );
                newSections[idx].is_active = v;
                setSections(newSections);
              }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Announcement Text</label>
            <input
              value={annSection.title || ""}
              onChange={(e) => {
                const newSections = [...sections];
                const idx = newSections.findIndex(
                  (s) => s.section_key === "announcement_bar",
                );
                newSections[idx].title = e.target.value;
                setSections(newSections);
              }}
              className="w-full bg-black/20 border border-[#e8e2d6] rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Link URL (Optional)</label>
            <input
              value={settings.announcement_bar_link || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  announcement_bar_link: e.target.value,
                })
              }
              className="w-full bg-black/20 border border-[#e8e2d6] rounded p-2"
              placeholder="/products"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.announcement_bar_bg || "#c9a84c"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcement_bar_bg: e.target.value,
                    })
                  }
                  className="w-12 h-10 bg-transparent border-0 rounded cursor-pointer"
                />
                <input
                  value={settings.announcement_bar_bg || "#c9a84c"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcement_bar_bg: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded p-2 uppercase font-mono text-sm text-gray-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Text Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.announcement_bar_text_color || "#ffffff"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcement_bar_text_color: e.target.value,
                    })
                  }
                  className="w-12 h-10 bg-transparent border-0 rounded cursor-pointer"
                />
                <input
                  value={settings.announcement_bar_text_color || "#ffffff"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcement_bar_text_color: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded p-2 uppercase font-mono text-sm text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-[#5a7060] mb-2 text-sm uppercase">
            Live Preview
          </h3>
          <div
            className="w-full text-center py-2 px-4 text-sm font-medium rounded overflow-hidden shadow-2xl border border-[#e8e2d6]"
            style={{
              background: settings.announcement_bar_bg || "#c9a84c",
              color: settings.announcement_bar_text_color || "#ffffff",
            }}
          >
            <span>{annSection.title || "Your announcement here"}</span>
            {settings.announcement_bar_link && (
              <a
                href="#"
                className="ml-4 underline hover:no-underline font-bold"
                onClick={(e) => e.preventDefault()}
              >
                Shop Now &rarr;
              </a>
            )}
          </div>
        </div>

        <button
          disabled={saving}
          className="bg-[#c9a84c] text-[#ffffff] font-bold px-8 py-3 rounded w-full"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    );
  };

  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Homepage CMS Editor</h1>

      <div className="flex gap-4 border-b border-[#e8e2d6] overflow-x-auto no-scrollbar pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[#c9a84c] text-[#c9a84c]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#e8e2d6] p-6 text-gray-900">
        {loading ? (
          <div className="h-[40vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#c9a84c]" />
          </div>
        ) : (
          <>
            {activeTab === "banners" && renderBannersTab()}
            {activeTab === "sections" && renderSectionsTab()}
            {activeTab === "collections" && renderCollectionsTab()}
            {activeTab === "flash_sale" && renderFlashSaleTab()}
            {activeTab === "occasions" && renderOccasionsTab()}
            {activeTab === "trust_badges" && renderTrustBadgesTab()}
            {activeTab === "about" && renderAboutTab()}
            {activeTab === "announcement" && renderAnnouncementTab()}
          </>
        )}
      </div>
    </div>
  );
}
