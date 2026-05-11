export type PhotoSeries = "Moments" | "Street" | "Portraits" | "Visual Diary";

export type PortfolioPhoto = {
  id: string;
  title: string;
  series: PhotoSeries;
  src: string;
  alt: string;
  orientation: "portrait" | "landscape" | "square";
  featured?: boolean;
};

const imageBase = "/partneri/distopije/images";

export const heroPhoto = {
  src: `${imageBase}/hero.svg`,
  alt: "Hero photograph for Distopije JPG portfolio"
};

export const photos: PortfolioPhoto[] = [
  {
    id: "moments-01",
    title: "Quiet Gesture",
    series: "Moments",
    src: `${imageBase}/moments-01.svg`,
    alt: "Unstaged atmospheric moment from the Distopije JPG Moments series",
    orientation: "portrait",
    featured: true
  },
  {
    id: "street-01",
    title: "Crossing",
    series: "Street",
    src: `${imageBase}/street-01.svg`,
    alt: "Urban street scene with everyday visual tension",
    orientation: "landscape",
    featured: true
  },
  {
    id: "moments-02",
    title: "Afterlight",
    series: "Moments",
    src: `${imageBase}/moments-02.svg`,
    alt: "Quiet fragment of atmosphere from the Moments photography series",
    orientation: "square",
    featured: true
  },
  {
    id: "street-02",
    title: "Concrete Hour",
    series: "Street",
    src: `${imageBase}/street-02.svg`,
    alt: "Street detail and urban atmosphere photographed for Distopije JPG",
    orientation: "portrait",
    featured: true
  },
  {
    id: "moments-03",
    title: "Room Tone",
    series: "Moments",
    src: `${imageBase}/moments-03.svg`,
    alt: "Spontaneous moment and muted atmosphere from the Moments series",
    orientation: "landscape",
    featured: true
  },
  {
    id: "street-03",
    title: "Edge",
    series: "Street",
    src: `${imageBase}/street-03.svg`,
    alt: "Urban edge, street geometry and everyday visual tension",
    orientation: "square",
    featured: true
  },
  {
    id: "moments-04",
    title: "Still Signal",
    series: "Moments",
    src: `${imageBase}/moments-04.svg`,
    alt: "Unstaged frame focused on a quiet gesture and atmosphere",
    orientation: "portrait",
    featured: true
  },
  {
    id: "street-04",
    title: "Underpass",
    series: "Street",
    src: `${imageBase}/street-04.svg`,
    alt: "Street photograph of urban detail and subdued city atmosphere",
    orientation: "landscape",
    featured: true
  },
  {
    id: "visual-01",
    title: "Fragment I",
    series: "Visual Diary",
    src: `${imageBase}/visual-01.svg`,
    alt: "Visual diary fragment with editorial photographic atmosphere",
    orientation: "portrait",
    featured: true
  },
  {
    id: "portraits-01",
    title: "Face Study",
    series: "Portraits",
    src: `${imageBase}/portraits-01.svg`,
    alt: "Minimal portrait study from Distopije JPG",
    orientation: "square",
    featured: true
  },
  {
    id: "street-05",
    title: "Late Walk",
    series: "Street",
    src: `${imageBase}/street-05.svg`,
    alt: "Street scene with urban movement and visual tension",
    orientation: "portrait",
    featured: true
  },
  {
    id: "moments-05",
    title: "Soft Noise",
    series: "Moments",
    src: `${imageBase}/moments-05.svg`,
    alt: "Atmospheric spontaneous frame from the Moments gallery",
    orientation: "landscape",
    featured: true
  },
  {
    id: "moments-06",
    title: "Table Light",
    series: "Moments",
    src: `${imageBase}/moments-06.svg`,
    alt: "Quiet interior moment and visual fragment",
    orientation: "square"
  },
  {
    id: "moments-07",
    title: "Open Window",
    series: "Moments",
    src: `${imageBase}/moments-07.svg`,
    alt: "Unstaged moment with gentle atmosphere and natural light",
    orientation: "portrait"
  },
  {
    id: "moments-08",
    title: "Pause",
    series: "Moments",
    src: `${imageBase}/moments-08.svg`,
    alt: "Quiet pause captured as a spontaneous photographic fragment",
    orientation: "landscape"
  },
  {
    id: "moments-09",
    title: "Small Distance",
    series: "Moments",
    src: `${imageBase}/moments-09.svg`,
    alt: "Minimal unstaged frame from the Moments series",
    orientation: "portrait"
  },
  {
    id: "street-06",
    title: "Bus Stop",
    series: "Street",
    src: `${imageBase}/street-06.svg`,
    alt: "Everyday urban street scene and city detail",
    orientation: "landscape"
  },
  {
    id: "street-07",
    title: "Wall Line",
    series: "Street",
    src: `${imageBase}/street-07.svg`,
    alt: "Street geometry, wall texture and urban atmosphere",
    orientation: "portrait"
  },
  {
    id: "street-08",
    title: "Side Street",
    series: "Street",
    src: `${imageBase}/street-08.svg`,
    alt: "Urban side street with everyday visual tension",
    orientation: "square"
  },
  {
    id: "street-09",
    title: "Night Detail",
    series: "Street",
    src: `${imageBase}/street-09.svg`,
    alt: "Street detail photographed in a subdued urban mood",
    orientation: "landscape"
  },
  {
    id: "portraits-02",
    title: "Profile",
    series: "Portraits",
    src: `${imageBase}/portraits-02.svg`,
    alt: "Minimal profile portrait with editorial tone",
    orientation: "portrait"
  },
  {
    id: "portraits-03",
    title: "Portrait Fragment",
    series: "Portraits",
    src: `${imageBase}/portraits-03.svg`,
    alt: "Portrait fragment from Distopije JPG visual work",
    orientation: "square"
  },
  {
    id: "visual-02",
    title: "Visual Note",
    series: "Visual Diary",
    src: `${imageBase}/visual-02.svg`,
    alt: "Visual diary photograph focused on mood and fragment",
    orientation: "landscape"
  },
  {
    id: "visual-03",
    title: "Trace",
    series: "Visual Diary",
    src: `${imageBase}/visual-03.svg`,
    alt: "Atmospheric visual fragment for Distopije JPG",
    orientation: "portrait"
  }
];

export const series = [
  {
    title: "Moments",
    description: "Unstaged frames, quiet gestures and fragments of atmosphere.",
    anchor: "moments",
    coverId: "moments-01"
  },
  {
    title: "Street",
    description: "Street scenes, urban details and everyday visual tension.",
    anchor: "street",
    coverId: "street-01"
  },
  {
    title: "Portraits",
    description: "Faces, presence and restrained portrait fragments.",
    anchor: "portraits",
    coverId: "portraits-01"
  },
  {
    title: "Visual Diary",
    description: "Loose visual notes, fragments and atmospheric studies.",
    anchor: "visual-diary",
    coverId: "visual-01"
  }
];
