import { Hex } from "@aptos-labs/ts-sdk";

export async function lookUpImage(url: string){
     try {
        const res = await fetch(url);
        const buff = await res.blob();
        if (buff.type === "application/json") {
            const json = JSON.parse(await buff.text());
            return json.image
        }
        return url
    } catch (e) {
        return url;
    }
}

export function blobToBase64(blob: Blob) {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise((resolve) => {
      reader.onloadend = () => {
        resolve(reader.result);
      };
    });
  };

export const fileToUint8array = async (file: File): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export const uint8arrayToBase64 = (inscribedData: string) => {
  //convert to Hex and then to buffer
  const bytes = Hex.fromHexInput(inscribedData).data;
  return arrayBufferToBase64(bytes);
}

function arrayBufferToBase64( bytes ) {
  var binary = '';
  var len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
      binary += String.fromCharCode( bytes[ i ] );
  }
  return "data:image/png;base64," + window.btoa( binary );
}