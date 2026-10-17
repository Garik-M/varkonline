import { createFinancingSdk, type FinancingSdk } from "./sdk-core";
declare const __VARKONLINE_API_ORIGIN__: string;
declare global {
  interface Window {
    VarkonlineFinancing?: FinancingSdk;
  }
}

if (window.VarkonlineFinancing?.version === "1")
  window.VarkonlineFinancing.scan();
else if (!window.VarkonlineFinancing)
  window.VarkonlineFinancing = createFinancingSdk(__VARKONLINE_API_ORIGIN__);
