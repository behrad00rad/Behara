export const imageSource=name=>name?.startsWith('/')?name:`/images/${name}-1536.webp`;
export const productImages=piece=>piece.images?.length?piece.images:[{src:imageSource(`${piece.kind}-mockup`),role:'mockup',alt:piece.name},{src:imageSource(piece.image),role:'editorial',alt:piece.name},{src:imageSource(`${piece.image}-detail`),role:'detail',alt:piece.name}];
export function responsiveSource(src,width){return src.startsWith('/images/')?src.replace('-1536',`-${width}`):src;}
export const roles={mockup:['Studio mockup','موکاپ استودیو'],editorial:['Editorial photograph','تصویر ادیتوریال'],detail:['Detail photograph','تصویر جزئیات']};
