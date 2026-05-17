import os

def find_files():
    app_dir = r'd:\CRM\Labelwink\src\app'
    for root, dirs, files in os.walk(app_dir):
        for file in files:
            if file == 'page.tsx':
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if "'use client'" in content and ("metadata" in content or "generateMetadata" in content):
                            print(path)
                except Exception as e:
                    pass

if __name__ == "__main__":
    find_files()
