const PALETTE = [
  { bg: "#9B4D3A", sidebar: "rgba(80,30,20,0.45)" },    // warm terracotta
  { bg: "#1E3A2F", sidebar: "rgba(10,30,22,0.45)" },     // deep forest
  { bg: "#2D2640", sidebar: "rgba(20,16,35,0.45)" },     // muted purple
  { bg: "#3A5A6E", sidebar: "rgba(25,45,58,0.45)" },     // steel blue
  { bg: "#5C4033", sidebar: "rgba(45,28,18,0.45)" },     // dark espresso
  { bg: "#2E4A3E", sidebar: "rgba(18,35,28,0.45)" },     // sage green
  { bg: "#4A3B5C", sidebar: "rgba(35,25,48,0.45)" },     // dusty plum
  { bg: "#6B4E3D", sidebar: "rgba(55,35,25,0.45)" },     // warm umber
  { bg: "#2B3D50", sidebar: "rgba(15,28,42,0.45)" },     // midnight navy
  { bg: "#8B5E3C", sidebar: "rgba(70,42,22,0.45)" },     // burnished copper
  { bg: "#3D5C4A", sidebar: "rgba(25,45,32,0.45)" },     // moss
  { bg: "#5A3D4A", sidebar: "rgba(45,25,35,0.45)" },     // muted wine
  { bg: "#4E6B5A", sidebar: "rgba(32,55,40,0.45)" },     // eucalyptus
  { bg: "#704A3A", sidebar: "rgba(58,32,22,0.45)" },     // brick clay
  { bg: "#384858", sidebar: "rgba(22,32,45,0.45)" },     // slate
  { bg: "#C25D40", sidebar: "rgba(100,38,24,0.45)" },    // bold coral
  { bg: "#2A4A4A", sidebar: "rgba(15,38,38,0.45)" },     // dark teal
  { bg: "#5C5040", sidebar: "rgba(45,38,28,0.45)" },     // warm olive
  { bg: "#3A2E4E", sidebar: "rgba(25,18,40,0.45)" },     // deep violet
  { bg: "#6E4A5A", sidebar: "rgba(55,32,42,0.45)" },     // dusted rose
  { bg: "#445E3E", sidebar: "rgba(28,48,25,0.45)" },     // hunter green
  { bg: "#5E3A28", sidebar: "rgba(48,22,12,0.45)" },     // rust
  { bg: "#304060", sidebar: "rgba(18,28,50,0.45)" },     // oxford blue
  { bg: "#7A5548", sidebar: "rgba(62,38,30,0.45)" },     // sienna
  { bg: "#3E5050", sidebar: "rgba(25,40,40,0.45)" },     // charcoal teal
  { bg: "#8A6040", sidebar: "rgba(70,42,25,0.45)" },     // amber ochre
  { bg: "#4A5A3A", sidebar: "rgba(32,45,22,0.45)" },     // olive drab
  { bg: "#504058", sidebar: "rgba(38,28,45,0.45)" },     // twilight
  { bg: "#6A4840", sidebar: "rgba(54,30,25,0.45)" },     // mahogany
  { bg: "#385048", sidebar: "rgba(22,40,32,0.45)" },     // spruce
  { bg: "#5A4A38", sidebar: "rgba(45,35,22,0.45)" },     // driftwood
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getColorForPodcast(id: string, index: number) {
  const idx = (hashString(id) + index) % PALETTE.length;
  return PALETTE[idx];
}
