import os
import re

def find_clashes():
    app_dir = r'd:\CRM\Labelwink\src\app'
    for root, dirs, files in os.walk(app_dir):
        for file in files:
            if file == 'page.tsx':
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        has_use_client = "'use client'" in content or '"use client"' in content
                        has_metadata = "export const metadata" in content or "export async function generateMetadata" in content
                        if has_use_client and has_metadata:
                            print(path)
                except Exception as e:
                    pass

if __name__ == "__main__":
    find_clashes()
