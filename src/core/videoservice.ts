import axios from "axios";
import { IGPTResponse, IGPTUrlResult } from "./gptservice";
import fs from 'fs';
import path from 'path';
import { delay } from "./utils";
import { spawn } from'child_process';

export interface IVideoService {
    gen(imagesPaths: string[], videoPrefix:string): Promise<string | undefined>;
}

export class LocalVideoService implements IVideoService {

    private _ffmpegPath: string;

    constructor(ffmpegPath: string) {
        this._ffmpegPath = ffmpegPath;
    }

    async gen(imagesPaths: string[], videoPrefix:string): Promise<string | undefined> {
        const inputFile = path.resolve(`./staging/${videoPrefix}-input.txt`).replace(/\\/g,'/');
        const outputFile = path.resolve(`./staging/${videoPrefix}-output.mp4`).replace(/\\/g,'/');
        let inputFileStr = '';
        
        for (const image of imagesPaths) {
            let retry = 5;
            while(retry>0) {
                if (fs.existsSync(image)) {
                    inputFileStr +=`file '${path.resolve(image).replace(/\\/g,'/')}'\nduration 5\n`;
                    retry = 0; break;
                }
                else {
                    console.error(`Input image file not found: ${image}, Retry:${retry}`);
                    await delay(1000);
                }
                retry--;
            }
        }
        fs.writeFileSync(inputFile,inputFileStr);

        const ffmpegCommand = [
            '-f', 'concat',
            '-safe', '0',
            '-i', inputFile,
            '-vf', "zoompan=z='min(zoom+0.0015,1.5)':s=1024x1024:d=250",
            '-r', '30',
            outputFile
        ];
        console.log("inputFileStr:",inputFileStr);
        console.log("inputFile:",inputFile);
        console.log("outputFile:",outputFile);
        console.log("ffmpegCommand:",ffmpegCommand);

        await this.spawnffmpegAsync(ffmpegCommand, inputFile);

        return outputFile;
    }   

    private async spawnffmpegAsync(ffmpegCommand:any, inputFile:string): Promise<boolean> {
        return new Promise((resolve,reject)=>{
            try{
                const ffmpegProcess = spawn(this._ffmpegPath, ffmpegCommand);

                ffmpegProcess.stdout.on('data', (data) => {
                    console.log(`FFmpeg stdout: ${data}`);
                });
        
                ffmpegProcess.stderr.on('data', (data) => {
                    console.error(`FFmpeg stderr: ${data}`);
                });
        
                ffmpegProcess.on('close', (code) => {
                    if (code === 0) {
                        console.log(`Video ${inputFile} created successfully!`);
                        resolve(true);
                    } else {
                        console.error(`FFmpeg process exited with code ${code}`);
                        resolve(false);
                    }
                });
            }
            catch(err){
                console.log(err);
                resolve(false);
            }
        });
    }
}