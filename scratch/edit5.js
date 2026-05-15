const fs = require('fs');
const path = 'd:/CRM/Labelwink/src/app/admin/(dashboard)/cms/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const indices = [];
let i = code.indexOf('uploadCloudinary');
while (i !== -1) {
  indices.push(i);
  i = code.indexOf('uploadCloudinary', i + 1);
}

for (let j = indices.length - 1; j >= 0; j--) {
  const index = indices[j];
  
  let start = code.lastIndexOf('<div className="col-span-2">', index);
  if (start === -1 || (index - start > 1000)) {
     start = code.lastIndexOf('<div>', index);
  }
  let end = code.indexOf('</div>', index);
  end = code.indexOf('</div>', end + 1);
  
  const block = code.substring(start, end);
  if (block.includes('setEditingFlashSale')) {
      code = code.substring(0, start) + `<CloudinaryImagePicker
              label="Banner Image URL (Optional)"
              value={editingFlashSale.banner_image_url || ""}
              onChange={(url) =>
                setEditingFlashSale({
                  ...editingFlashSale,
                  banner_image_url: url,
                })
              }
            />` + code.substring(end + 6);
  } else if (block.includes('setAboutPage')) {
      let finalEnd = end + 6;
      let aboutImgStart = code.indexOf('{aboutPage.hero_image_url && (', end);
      if (aboutImgStart !== -1 && aboutImgStart - end < 100) {
          let aboutImgEnd = code.indexOf(')}', aboutImgStart);
          finalEnd = aboutImgEnd + 2;
      }
      code = code.substring(0, start) + `<CloudinaryImagePicker
              label="Hero Background Image"
              value={aboutPage.hero_image_url || ""}
              onChange={(url) =>
                setAboutPage({ ...aboutPage, hero_image_url: url })
              }
            />` + code.substring(finalEnd);
  }
}

fs.writeFileSync(path, code);
