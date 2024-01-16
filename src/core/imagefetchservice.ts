import axios from "axios";
import { IGPTResponse, IGPTUrlResult } from "./gptservice";
import fs from 'fs';

export interface IImageFetchService {
   fetch(urls:string[], imagePrefix?:string): Promise<string[]>;
}

export class LocalImageFetchSaveService implements IImageFetchService {
   async fetch(urls:string[], imagePrefix?:string): Promise<string[]> {
      const timestamp = Date.now();
      let imageIndex = 0;
      const filePaths:string[] = [];
      for (let url of urls || []) {
         const filePrefix = imagePrefix ? `${imagePrefix}-` : ``;
         let filename = `./content/${filePrefix}${timestamp}-${imageIndex}.png`;
         try {
            let response = await axios({
               method: 'get',
               url,
               responseType: 'stream',
            });
            response.data.pipe(fs.createWriteStream(filename));
            console.log(`Saved: filename=${filename}, url=${url}`);
            filePaths.push(filename);
         }
         catch (err) {
            console.log(`Error: filename=${filename}, url=${url}`);
            console.log(err);
         }
         imageIndex++;
      }
      return filePaths;
   }
}