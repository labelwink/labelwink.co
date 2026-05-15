const fs = require('fs');
const path = 'd:/CRM/Labelwink/src/app/admin/(dashboard)/cms/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Remove uploadCloudinary definition
code = code.replace(/const uploadCloudinary = \(onSuccess: \(url: string\) => void\) => \{[\s\S]*?toast\.error\("Cloudinary widget not loaded"\);\n\s*\}\n\s*\};\n/, '');

// Fix editingFlashSale banner image
code = code.replace(
  /<div>\s*<label className="block text-sm mb-1">Banner Image URL<\/label>\s*<div className="flex gap-2">[\s\S]*?<UploadCloud className="w-4 h-4" \/>\s*<\/button>\s*<\/div>\s*<\/div>/g,
  `<CloudinaryImagePicker
      label="Banner Image URL"
      value={editingFlashSale.banner_image_url ?? ""}
      onChange={url =>
        setEditingFlashSale({ ...editingFlashSale, banner_image_url: url })
      }
    />`
);

// Fix aboutPage hero image
code = code.replace(
  /<div>\s*<label className="block text-sm mb-1">Hero Image URL<\/label>\s*<div className="flex gap-2">[\s\S]*?<UploadCloud className="w-4 h-4" \/>\s*<\/button>\s*<\/div>[\s\S]*?<\/div>/g,
  `<CloudinaryImagePicker
      label="Hero Image URL"
      value={aboutPage.hero_image_url ?? ""}
      onChange={url =>
        setAboutPage({ ...aboutPage, hero_image_url: url })
      }
    />`
);

// Fix aboutPage team image if any
code = code.replace(
  /<div>\s*<label className="block text-sm mb-1">Team Image URL<\/label>\s*<div className="flex gap-2">[\s\S]*?<UploadCloud className="w-4 h-4" \/>\s*<\/button>\s*<\/div>[\s\S]*?<\/div>/g,
  `<CloudinaryImagePicker
      label="Team Image URL"
      value={aboutPage.team_image_url ?? ""}
      onChange={url =>
        setAboutPage({ ...aboutPage, team_image_url: url })
      }
    />`
);

// Fallback replace if there's still uploadCloudinary
if (code.includes('uploadCloudinary')) {
  console.log("Still has uploadCloudinary");
} else {
  console.log("No uploadCloudinary found.");
}

fs.writeFileSync(path, code);
