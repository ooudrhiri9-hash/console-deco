import type { Category } from '@/types';

/**
 * The five families from the client brief:
 * console · console+tableau · table basse · table d'appoint · tableau
 * then the artworks split by format: duo, trio, rectangulaire.
 *
 * `id` is permanent; `slug` is the URL and is translated per locale.
 * Changing a slug later breaks links — set redirects if you must.
 */
export const categories: Category[] = [
  {
    id: 'consoles',
    order: 1,
    slug: { fr: 'consoles', en: 'consoles' },
    name: { fr: 'Consoles', en: 'Consoles' },
    tagline: { fr: 'La pièce qui pose l’entrée', en: 'The piece that sets the entrance' },
    description: {
      fr: 'La console est la première chose que l’on voit en entrant. Nos consoles sont fabriquées à la main dans notre atelier au Maroc, en bois massif, métal et pierre, dans des dimensions pensées pour les entrées et les salons marocains. Chaque modèle existe en série limitée et peut être adapté à vos mesures.',
      en: 'A console is the first thing you see when you walk in. Ours are handmade in our Moroccan workshop from solid wood, metal and stone, in proportions designed for Moroccan entrances and living rooms. Every model comes in a limited run and can be adapted to your measurements.',
    },
    image: '/media/products/console-demi-lunes-1.webp',
  },
  {
    id: 'console-tableau',
    order: 2,
    slug: { fr: 'ensembles-console-tableau', en: 'console-artwork-sets' },
    name: { fr: 'Ensembles console + tableau', en: 'Console + artwork sets' },
    tagline: { fr: 'Le mur composé d’un seul geste', en: 'A whole wall, composed at once' },
    description: {
      fr: 'Notre signature : une console et son tableau dessinés ensemble, mêmes matières et mêmes teintes. Vous n’avez plus à chercher le tableau qui ira avec le meuble — l’accord est déjà fait. Un ensemble complet, livré assorti, pour habiller un mur d’entrée ou de salon en une seule commande.',
      en: 'Our signature: a console and its artwork designed as one, sharing materials and tones. No more hunting for a painting that matches the furniture — the pairing is already done. A complete set, delivered matched, to dress an entrance or living-room wall in a single order.',
    },
    image: '/media/categories/console-tableau.webp',
  },
  {
    id: 'tables-basses',
    order: 3,
    slug: { fr: 'tables-basses', en: 'coffee-tables' },
    name: { fr: 'Tables basses', en: 'Coffee tables' },
    tagline: { fr: 'Le centre du salon', en: 'The centre of the room' },
    description: {
      fr: 'Une table basse se regarde autant qu’elle sert. Les nôtres jouent sur les contrastes de matière — bois brut et laiton, pierre et métal noir — dans des formats adaptés aux salons marocains, du salon traditionnel au séjour contemporain. Finitions à la main, pièce par pièce.',
      en: 'A coffee table is looked at as much as it is used. Ours play on contrasts of material — raw wood and brass, stone and blackened metal — in formats suited to Moroccan living rooms, from traditional salons to contemporary spaces. Hand-finished, piece by piece.',
    },
    image: '/media/products/table-basse-damier-1.webp',
  },
  {
    id: 'tables-appoint',
    order: 4,
    slug: { fr: 'tables-d-appoint', en: 'side-tables' },
    name: { fr: 'Tables d’appoint', en: 'Side tables' },
    tagline: { fr: 'Petite pièce, grand effet', en: 'Small piece, large effect' },
    description: {
      fr: 'La table d’appoint est la touche finale : à côté d’un fauteuil, au bout d’un canapé, dans un coin de chambre. Sculpturales et légères à déplacer, nos tables d’appoint se marient à nos tables basses et à nos consoles pour composer un ensemble cohérent.',
      en: 'The side table is the finishing touch: beside an armchair, at the end of a sofa, in a bedroom corner. Sculptural and easy to move, our side tables are designed to sit alongside our coffee tables and consoles as one coherent set.',
    },
    image: '',
  },
  {
    id: 'tableaux',
    order: 5,
    slug: { fr: 'tableaux', en: 'wall-art' },
    name: { fr: 'Tableaux', en: 'Wall art' },
    tagline: { fr: 'L’œuvre qui change la pièce', en: 'The work that changes the room' },
    description: {
      fr: 'Tableaux décoratifs peints et finis à la main : abstrait, art marocain, calligraphie, matières et reliefs. Formats uniques, diptyques et triptyques, avec ou sans caisse américaine. Nous réalisons également les dimensions sur mesure pour un mur précis.',
      en: 'Decorative artworks, hand-painted and hand-finished: abstract, Moroccan art, calligraphy, textures and relief. Single formats, diptychs and triptychs, with or without a floating frame. We also produce made-to-measure dimensions for a specific wall.',
    },
    image: '/media/categories/tableaux.webp',
  },
  {
    id: 'tableaux-duo',
    order: 6,
    slug: { fr: 'tableaux-duo', en: 'artwork-duos' },
    name: { fr: 'Tableaux en duo', en: 'Artwork duos' },
    tagline: { fr: 'Deux toiles, une seule composition', en: 'Two canvases, one composition' },
    description: {
      fr: "Deux toiles pensées comme une seule composition : mêmes teintes, mêmes matières, un dessin qui se poursuit de l'une à l'autre. Côte à côte, elles occupent un mur que la plupart des pièces seules laisseraient vide. Peintes à la main dans notre atelier au Maroc et livrées ensemble.",
      en: 'Two canvases conceived as a single composition: shared tones, shared materials, a line that carries from one to the other. Side by side they fill a wall most single pieces would leave bare. Hand-painted in our Moroccan workshop and delivered together.',
    },
    image: '/media/categories/tableaux-duo.webp',
  },
  {
    id: 'tableaux-trio',
    order: 7,
    slug: { fr: 'tableaux-trio', en: 'artwork-trios' },
    name: { fr: 'Tableaux en trio', en: 'Artwork trios' },
    tagline: { fr: 'Trois toiles, un mur entier', en: 'Three canvases, a whole wall' },
    description: {
      fr: "Trois toiles qui se lisent d'un bout à l'autre du mur. C'est le format le plus large de l'atelier, celui des grands pans de salon où une pièce unique se perdrait. Peintes à la main au Maroc, livrées ensemble et dans l'ordre prévu.",
      en: "Three canvases that read across the whole wall. The workshop's widest format, made for the long living-room walls where a single piece would be lost. Hand-painted in Morocco, delivered together and in their intended order.",
    },
    image: '/media/categories/tableaux-trio.webp',
  },
  {
    id: 'tableaux-rectangulaires',
    order: 8,
    slug: { fr: 'tableaux-rectangulaires', en: 'rectangular-artworks' },
    name: { fr: 'Tableaux rectangulaires', en: 'Rectangular artworks' },
    tagline: { fr: 'La toile qui suit la longueur du mur', en: 'A canvas that follows the length of the wall' },
    description: {
      fr: 'Des toiles en longueur, peintes à la main dans notre atelier au Maroc. Le format rectangulaire épouse le mur d’un salon, le dessus d’un canapé ou d’une console, là où un carré paraîtrait trop court. Quatre formats, du 60 × 60 au 120 × 120 cm, et le sur-mesure pour un mur précis.',
      en: 'Wide canvases, hand-painted in our Moroccan workshop. The rectangular format follows a living-room wall, the space above a sofa or a console, where a square would feel too short. Four sizes, from 60 × 60 to 120 × 120 cm, and made to measure for a specific wall.',
    },
    image: '/media/categories/tableaux-rectangulaires.webp',
  },
];

export const categoriesInOrder = [...categories].sort((a, b) => a.order - b.order);

export const getCategory = (id: string) => categories.find((c) => c.id === id);
