declare module "upng-js" {
  type UPNGModule = {
    encode(imgs: ArrayBuffer[], width: number, height: number, colorCount: number, delays?: number[]): ArrayBuffer;
  };

  const UPNG: UPNGModule;

  export default UPNG;
}
