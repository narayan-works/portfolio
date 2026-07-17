import os
import sys
import subprocess
import shutil
from PIL import Image

# Target folders to scan
TARGET_DIRS = [
    "/Users/narayan/Documents/GitHub/portfolio/src/assets",
    "/Users/narayan/Documents/GitHub/portfolio/public/assets"
]

# File size threshold (500 KB)
SIZE_THRESHOLD_BYTES = 500 * 1024

def get_file_size(path):
    return os.path.getsize(path)

def format_size(size_bytes):
    if size_bytes >= 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.2f} MB"
    else:
        return f"{size_bytes / 1024:.2f} KB"

def optimize_gif(file_path):
    temp_path = file_path + ".tmp.gif"
    try:
        # Run gifsicle with lossy optimization
        cmd = ["gifsicle", "-O3", "--lossy=30", "--colors", "128", "-o", temp_path, file_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"  [Error] gifsicle failed for {os.path.basename(file_path)}: {result.stderr.strip()}")
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return None
        
        if os.path.exists(temp_path):
            orig_size = get_file_size(file_path)
            new_size = get_file_size(temp_path)
            if new_size < orig_size:
                shutil.move(temp_path, file_path)
                return new_size
            else:
                os.remove(temp_path)
                return orig_size
    except Exception as e:
        print(f"  [Exception] Failed to optimize GIF {file_path}: {e}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
    return None

def optimize_png(file_path):
    # pngquant outputs to file-opt.png if we specify it
    base, ext = os.path.splitext(file_path)
    opt_path = base + "-opt" + ext
    try:
        cmd = ["pngquant", "--quality=80-90", "--ext", "-opt.png", "--force", file_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        # pngquant exits with 0 on success, or 98/99 for warning/quality limit issues
        if os.path.exists(opt_path):
            orig_size = get_file_size(file_path)
            new_size = get_file_size(opt_path)
            if new_size < orig_size:
                shutil.move(opt_path, file_path)
                return new_size
            else:
                os.remove(opt_path)
                return orig_size
        else:
            print(f"  [Warning] pngquant did not produce output for {os.path.basename(file_path)} (returncode {result.returncode})")
    except Exception as e:
        print(f"  [Exception] Failed to optimize PNG {file_path}: {e}")
        if os.path.exists(opt_path):
            os.remove(opt_path)
    return None

def optimize_jpeg(file_path):
    temp_path = file_path + ".tmp.jpg"
    try:
        # Load and resave JPEG with Pillow at quality=80
        img = Image.open(file_path)
        
        # Keep transparency if converted? No, JPEGs don't support transparency.
        # Ensure it's RGB
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        img.save(temp_path, "JPEG", optimize=True, quality=80)
        
        orig_size = get_file_size(file_path)
        new_size = get_file_size(temp_path)
        if new_size < orig_size:
            shutil.move(temp_path, file_path)
            return new_size
        else:
            os.remove(temp_path)
            return orig_size
    except Exception as e:
        print(f"  [Exception] Failed to optimize JPEG {file_path}: {e}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
    return None

def main():
    print("=" * 70)
    print("Starting Media Optimization Pass")
    print(f"Scanning directories for files > {format_size(SIZE_THRESHOLD_BYTES)}")
    print("=" * 70)
    
    files_to_optimize = []
    
    for target_dir in TARGET_DIRS:
        if not os.path.exists(target_dir):
            print(f"Directory not found: {target_dir}")
            continue
            
        for root, dirs, files in os.walk(target_dir):
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in [".gif", ".png", ".jpg", ".jpeg"]:
                    file_path = os.path.join(root, file)
                    size = get_file_size(file_path)
                    if size >= SIZE_THRESHOLD_BYTES:
                        files_to_optimize.append((file_path, ext, size))
                        
    if not files_to_optimize:
        print("No files found exceeding the size threshold.")
        return
        
    print(f"Found {len(files_to_optimize)} files to optimize.")
    print("-" * 70)
    
    results = []
    total_saved = 0
    
    for idx, (path, ext, orig_size) in enumerate(files_to_optimize):
        rel_path = os.path.relpath(path, "/Users/narayan/Documents/GitHub/portfolio")
        print(f"[{idx+1}/{len(files_to_optimize)}] Optimizing: {rel_path} ({format_size(orig_size)})")
        
        new_size = None
        if ext == ".gif":
            new_size = optimize_gif(path)
        elif ext == ".png":
            new_size = optimize_png(path)
        elif ext in [".jpg", ".jpeg"]:
            new_size = optimize_jpeg(path)
            
        if new_size is not None and new_size < orig_size:
            saved = orig_size - new_size
            total_saved += saved
            reduction = (saved / orig_size) * 100
            print(f"  -> SUCCESS: {format_size(orig_size)} -> {format_size(new_size)} (Reduced by {reduction:.1f}%)")
            results.append((rel_path, orig_size, new_size, saved))
        else:
            print(f"  -> SKIPPED: Already optimized or optimization didn't reduce size.")
            results.append((rel_path, orig_size, orig_size, 0))
            
    print("=" * 70)
    print("Optimization Summary:")
    print("=" * 70)
    print(f"{'File Path':<50} | {'Before':<10} | {'After':<10} | {'Saved':<10}")
    print("-" * 90)
    for rel_path, orig, new, saved in results:
        # Truncate path if too long
        display_path = rel_path if len(rel_path) <= 47 else "..." + rel_path[-44:]
        print(f"{display_path:<50} | {format_size(orig):<10} | {format_size(new):<10} | {format_size(saved):<10}")
    print("-" * 90)
    print(f"Total space saved: {format_size(total_saved)}")
    print("=" * 70)

if __name__ == "__main__":
    main()
