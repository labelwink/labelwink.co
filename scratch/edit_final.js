const fs = require('fs');
const path = 'd:/CRM/Labelwink/src/app/admin/(dashboard)/cms/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add import
if (!code.includes('CloudinaryImagePicker')) {
  code = code.replace('import {', "import { CloudinaryImagePicker } from '@/components/admin/CloudinaryImagePicker';\nimport {");
}

// Remove uploadCloudinary definition
const defStart = code.indexOf('const uploadCloudinary = (onSuccess: (url: string) => void) => {');
if (defStart !== -1) {
  const defEnd = code.indexOf('// Drag and drop helper', defStart);
  if (defEnd !== -1) {
    code = code.substring(0, defStart) + code.substring(defEnd);
  }
}

// Find every `uploadCloudinary` and replace its enclosing input/button block with `<CloudinaryImagePicker />`
// I'll do this carefully.
let iters = 0;
while (code.includes('uploadCloudinary') && iters < 20) {
  iters++;
  const uIdx = code.indexOf('uploadCloudinary');
  
  // Find the label above it to determine what we are replacing.
  // We look for `<label className="block text-` or `admin-label` before it.
  const labelStart = code.lastIndexOf('<label', uIdx);
  const labelEnd = code.indexOf('</label>', labelStart);
  let labelText = code.substring(labelStart, labelEnd).replace(/<[^>]+>/g, '').trim();
  
  // Find what state it sets
  const setStateIdx = code.indexOf('set', uIdx);
  const braceIdx = code.indexOf('({', setStateIdx);
  const setStateName = code.substring(setStateIdx, braceIdx).trim(); // e.g. setEditingSection
  
  const entityNameMatch = code.substring(braceIdx, braceIdx + 50).match(/\.\.\.([a-zA-Z0-9_]+)/);
  let entityName = entityNameMatch ? entityNameMatch[1] : '';
  
  // Find property name. The arrow fn looks like `url => setX({...x, prop: url})`
  // so `prop:` comes before `url`
  const objContent = code.substring(braceIdx + 2, code.indexOf('})', braceIdx));
  let propMatch = objContent.match(/([a-zA-Z0-9_]+)\s*:\s*url/);
  let propName = propMatch ? propMatch[1] : 'image_url';
  
  // Now find the start and end of the block to replace.
  // The block usually starts at the label, or the div containing the label.
  let blockStart = code.lastIndexOf('<div', labelStart);
  if (code.substring(blockStart, labelStart).includes('col-span-2')) {
      blockStart = code.lastIndexOf('<div className="col-span-2"', labelStart);
  } else if (code.substring(blockStart, labelStart).includes('admin-field')) {
      blockStart = code.lastIndexOf('<div className="admin-field"', labelStart);
  }
  
  // The block ends after the button or after an optional image preview
  let blockEnd = code.indexOf('</div>', uIdx); 
  // It's nested: `<div className="flex ..."><input/><button>...</div>`
  // We need to close the outer div.
  blockEnd = code.indexOf('</div>', blockEnd + 1);
  
  // Check if there's an img tag after it like `{entity.prop && <img ... />}`
  const imgCheck = code.indexOf('{', blockEnd);
  if (imgCheck !== -1 && imgCheck - blockEnd < 20) {
      const imgCheckContent = code.substring(imgCheck, imgCheck + 50);
      if (imgCheckContent.includes(propName) && imgCheckContent.includes('img')) {
          blockEnd = code.indexOf(')}', imgCheck) + 2;
          blockEnd = code.indexOf('</div>', blockEnd) !== -1 ? code.indexOf('</div>', blockEnd) : blockEnd;
      }
  }

  const replacement = `<CloudinaryImagePicker
      label="${labelText}"
      value={${entityName}.${propName} ?? ""}
      onChange={url => ${setStateName}({ ...${entityName}, ${propName}: url })}
    />`;

  code = code.substring(0, blockStart) + replacement + code.substring(blockEnd + 6);
}

// Banners Tab is special as per user instructions
const renderBannersTabStart = code.indexOf('const renderBannersTab = () => {');
const renderBannersTabEnd = code.indexOf('const renderSectionsTab = () => {');
if (renderBannersTabStart !== -1 && renderBannersTabEnd !== -1) {
    let bannersTabCode = code.substring(renderBannersTabStart, renderBannersTabEnd);
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
}

fs.writeFileSync(path, code);
console.log("Done");
