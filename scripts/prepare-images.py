"""Create responsive WebP encodings from the generated editorial originals."""
from pathlib import Path
from PIL import Image
import json

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'src/assets/editorial/manifest.json').read_text(encoding='utf-8'))
output = root / 'public/images'
output.mkdir(parents=True, exist_ok=True)
for source in (root / 'src/assets/editorial').glob('*.png'):
    name = source.stem
    with Image.open(source) as image:
        image = image.convert('RGB')
        for width in [480, 960, 1536]:
            height = round(image.height * width / image.width)
            image.resize((width, height), Image.Resampling.LANCZOS).save(output / f'{name}-{width}.webp', 'WEBP', quality=78, method=6)
    print(name, ', '.join(f'{width}px: {(output / f"{name}-{width}.webp").stat().st_size // 1024} KB' for width in [480,960,1536]))
