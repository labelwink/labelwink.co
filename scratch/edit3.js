const fs = require('fs');
const path = 'd:/CRM/Labelwink/src/app/admin/(dashboard)/cms/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const defStart = code.indexOf('const uploadCloudinary = (onSuccess: (url: string) => void) => {');
if (defStart !== -1) {
  const defEnd = code.indexOf('// Drag and drop helper', defStart);
  if (defEnd !== -1) {
    code = code.substring(0, defStart) + code.substring(defEnd);
  }
}

code = code.replace(
  /<div>\s*<label className="block text-sm mb-1">Banner Image URL<\/label>\s*<div className="flex gap-2">[\s\S]*?<UploadCloud className="w-4 h-4" \/>\s*<\/button>\s*<\/div>\s*<\/div>/g,
  `<CloudinaryImagePicker
              label="Banner Image URL"
              value={editingFlashSale.banner_image_url || ""}
              onChange={(url) =>
                setEditingFlashSale({
                  ...editingFlashSale,
                  banner_image_url: url,
                })
              }
            />`
);

code = code.replace(
  /<div>\s*<label className="block text-sm mb-1">Hero Image URL<\/label>\s*<div className="flex gap-2">[\s\S]*?<UploadCloud className="w-4 h-4" \/>\s*<\/button>\s*<\/div>\s*\{aboutPage\.hero_image_url && \([\s\S]*?<\/img>\s*\)\}\s*<\/div>/g,
  `<CloudinaryImagePicker
              label="Hero Image URL"
              value={aboutPage.hero_image_url || ""}
              onChange={(url) =>
                setAboutPage({ ...aboutPage, hero_image_url: url })
              }
            />`
);

fs.writeFileSync(path, code);
