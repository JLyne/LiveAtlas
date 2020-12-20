declare module '*.svg' {
  const content: any;
  export default content;
}

interface BrowserSpriteSymbol {
  id: string;
  viewBox: string;
  content: string;
  node: SVGSymbolElement;
  url: string;
}