const fs = require('fs');
const path = 'd:/CRM/Labelwink/src/app/admin/(dashboard)/cms/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!code.includes('CloudinaryImagePicker')) {
  code = code.replace('import {', "import { CloudinaryImagePicker } from '@/components/admin/CloudinaryImagePicker';\nimport {");
}

// 2. Remove uploadCloudinary
code = code.replace(/const uploadCloudinary[\s\S]*?toast\.error\("Cloudinary widget not loaded"\);\n\s*\}\n\s*};\n/m, '');

// 3. Replace all instances of `<div><label...>Image URL</label>...</div>` with CloudinaryImagePicker
// It's a bit complicated with regex, let's just do it manually for the banner part.
// Actually, let's rewrite renderBannersTab

// We need to replace the form in renderBannersTab
const renderBannersTabStart = code.indexOf('const renderBannersTab = () => {');
const renderBannersTabEnd = code.indexOf('const renderSectionsTab = () => {');
let bannersTabCode = code.substring(renderBannersTabStart, renderBannersTabEnd);

// Replace the form
const formRegex = /<form[\s\S]*?<\/form>/;

const newForm = `<form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            const method = editingBanner.id ? "PATCH" : "POST";
            const url = editingBanner.id
              ? \`/api/admin/cms/banners/\${editingBanner.id}\`
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
          className="space-y-5"
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="admin-field">
              <label className="admin-label">Title *</label>
              <input
                type="text"
                required
                value={editingBanner.title || ""}
                onChange={(e) =>
                  setEditingBanner({ ...editingBanner, title: e.target.value })
                }
                placeholder="e.g. New Season Sale"
                className="admin-input"
              />
            </div>
            
            <div className="admin-field">
              <label className="admin-label">Subtitle</label>
              <input
                type="text"
                value={editingBanner.subtitle || ""}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    subtitle: e.target.value,
                  })
                }
                placeholder="e.g. Up to 40% off"
                className="admin-input"
              />
            </div>
            
            <div className="admin-field">
              <label className="admin-label">CTA Text</label>
              <input
                type="text"
                value={editingBanner.cta_text || ""}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    cta_text: e.target.value,
                  })
                }
                placeholder="e.g. Shop Now"
                className="admin-input"
              />
            </div>
            
            <div className="admin-field">
              <label className="admin-label">CTA URL</label>
              <input
                type="text"
                value={editingBanner.cta_url || ""}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    cta_url: e.target.value,
                  })
                }
                placeholder="e.g. /products?category=kurtis"
                className="admin-input"
              />
            </div>
          </div>
          
          <CloudinaryImagePicker
            label="Desktop Image *"
            value={editingBanner.image_url ?? ''}
            onChange={url =>
              setEditingBanner({ ...editingBanner, image_url: url })}
            folder="labelwink/banners"
          />
          
          <CloudinaryImagePicker
            label="Mobile Image (Optional)"
            value={editingBanner.mobile_image_url ?? ''}
            onChange={url =>
              setEditingBanner({ ...editingBanner, mobile_image_url: url })}
            folder="labelwink/banners"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="admin-field">
              <label className="admin-label">Position</label>
              <select
                value={editingBanner.position || "hero"}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    position: e.target.value,
                  })
                }
                className="admin-select"
              >
                <option value="hero">Hero</option>
                <option value="banner">Banner</option>
                <option value="strip">Strip</option>
                <option value="popup">Popup</option>
              </select>
            </div>
            
            <div className="admin-field">
              <label className="admin-label">Sort Order</label>
              <input
                type="number"
                value={editingBanner.sort_order ?? 0}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    sort_order: parseInt(e.target.value),
                  })
                }
                min="0"
                className="admin-input"
              />
            </div>
          </div>
          
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={editingBanner.is_active !== false}
              onChange={(e) =>
                setEditingBanner({ ...editingBanner, is_active: e.target.checked })
              }
              className="w-4 h-4 rounded accent-[#1C3829]"
            />
            <span className="text-sm font-medium text-gray-700">
              Active immediately
            </span>
          </label>
          
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="lw-btn-primary px-6 py-2.5"
            >
              {saving ? "Saving..." : "Save Banner"}
            </button>
            <button
              type="button"
              onClick={() => setEditingBanner(null)}
              className="lw-btn-ghost px-4 py-2.5"
            >
              Cancel
            </button>
          </div>
        </form>`;

bannersTabCode = bannersTabCode.replace(formRegex, newForm);
code = code.substring(0, renderBannersTabStart) + bannersTabCode + code.substring(renderBannersTabEnd);

// Now apply CloudinaryImagePicker to other instances
// 1. Sections
code = code.replace(
  /<div>\s*<label className="block text-sm mb-1">Image URL<\/label>\s*<div className="flex gap-2">[\s\S]*?<\/div>\s*<\/div>/g,
  (match) => {
    // Determine the state name based on what's inside
    const stateMatch = match.match(/set([A-Za-z]+)\(\{/);
    if (!stateMatch) return match;
    const setterName = stateMatch[1]; // e.g., 'EditingSection'
    const stateVar = 'editing' + setterName.substring(7); // if setter is setEditingSection, state is editingSection. wait.
    let entity = 'editingSection';
    if (setterName === 'EditingSection') entity = 'editingSection';
    else if (setterName === 'EditingCollection') entity = 'editingCollection';
    else if (setterName === 'EditingFlashSale') entity = 'editingFlashSale';
    else if (setterName === 'EditingOccasion') entity = 'editingOccasion';
    else if (setterName === 'AboutPage') entity = 'aboutPage';
    else if (setterName === 'EditingBanner') entity = 'editingBanner';
    
    // figure out property
    const propMatch = match.match(/value=\{([A-Za-z0-9_.]+)\.([A-Za-z0-9_]+) \|\| ""\}/);
    let prop = 'image_url';
    if (propMatch) prop = propMatch[2];
    else {
        const propMatch2 = match.match(/value=\{([A-Za-z0-9_]+)\.([A-Za-z0-9_]+) \|\| ""\}/);
        if (propMatch2) prop = propMatch2[2];
    }
    
    return `<CloudinaryImagePicker
      label="Image URL"
      value={${entity}.${prop} ?? ''}
      onChange={url =>
        set${setterName}({ ...${entity}, ${prop}: url })
      }
    />`;
  }
);

// We need a specific replace for Banner Image URL in Collections and Flash Sales
code = code.replace(
  /<div>\s*<label className="block text-xs mb-1">\s*Banner Image URL\s*<\/label>\s*<div className="flex gap-2">[\s\S]*?<\/div>\s*<\/div>/g,
  (match) => {
    const stateMatch = match.match(/set([A-Za-z]+)\(\{/);
    if (!stateMatch) return match;
    const setterName = stateMatch[1];
    let entity = 'editing' + setterName.substring(7);
    if (setterName === 'EditingCollection') entity = 'editingCollection';
    if (setterName === 'EditingFlashSale') entity = 'editingFlashSale';
    
    return `<CloudinaryImagePicker
      label="Banner Image URL"
      value={${entity}.banner_image_url ?? ''}
      onChange={url =>
        set${setterName}({ ...${entity}, banner_image_url: url })
      }
    />`;
  }
);

code = code.replace(
  /<div>\s*<label className="block text-sm mb-1">Banner Image URL<\/label>\s*<div className="flex gap-2">[\s\S]*?<\/div>\s*<\/div>/g,
  (match) => {
    const stateMatch = match.match(/set([A-Za-z]+)\(\{/);
    if (!stateMatch) return match;
    const setterName = stateMatch[1];
    let entity = 'editing' + setterName.substring(7);
    if (setterName === 'EditingFlashSale') entity = 'editingFlashSale';
    
    return `<CloudinaryImagePicker
      label="Banner Image URL"
      value={${entity}.banner_image_url ?? ''}
      onChange={url =>
        set${setterName}({ ...${entity}, banner_image_url: url })
      }
    />`;
  }
);

// Look for unreplaced ones
const remaining = [...code.matchAll(/uploadCloudinary/g)];
console.log('Remaining uploadCloudinary:', remaining.length);

fs.writeFileSync(path, code);
