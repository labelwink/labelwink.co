const fs = require('fs');
const path = 'd:/CRM/Labelwink/src/app/admin/(dashboard)/cms/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /<div className="col-span-2">\s*<label className="block text-sm mb-1">\s*Banner Image URL \(Optional\)\s*<\/label>\s*<div className="flex gap-2">[\s\S]*?<UploadCloud className="w-4 h-4" \/>\s*<\/button>\s*<\/div>\s*<\/div>/g,
  `<CloudinaryImagePicker
              label="Banner Image URL (Optional)"
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
  /<div className="col-span-2">\s*<label className="block text-sm mb-1">\s*Hero Background Image\s*<\/label>\s*<div className="flex gap-2">[\s\S]*?<UploadCloud className="w-4 h-4" \/>\s*<\/button>\s*<\/div>\s*\{aboutPage\.hero_image_url && \([\s\S]*?<\/img>\s*\)\}\s*<\/div>/g,
  `<CloudinaryImagePicker
              label="Hero Background Image"
              value={aboutPage.hero_image_url || ""}
              onChange={(url) =>
                setAboutPage({ ...aboutPage, hero_image_url: url })
              }
            />`
);

fs.writeFileSync(path, code);
