import axios from "axios";
import { IGPTResponse, IGPTUrlResult } from "./gptservice";
import fs from 'fs';
import path from 'path';
import { delay } from "./utils";
import { spawn } from'child_process';

export interface IVideoService {
    gen(imagesPaths: string[], audioPath: string | undefined, videoPrefix:string): Promise<string | undefined>;
}

export class LocalVideoService implements IVideoService {

    private _ffmpegPath: string;

    constructor(ffmpegPath: string) {
        this._ffmpegPath = ffmpegPath;
    }

    async gen(imagesPaths: string[], audioPath: string | undefined, videoPrefix:string): Promise<string | undefined> {
        const inputFile = path.resolve(`./staging/${videoPrefix}-input.txt`).replace(/\\/g,'/');
        const outputSoundlessMp4Path = path.resolve(`./staging/${videoPrefix}-output-soundless.mp4`).replace(/\\/g,'/');
        const outputSoundMp4Path = path.resolve(`./staging/${videoPrefix}-output-sound.mp4`).replace(/\\/g,'/');
        let inputFileStr = '';

        for (const image of imagesPaths) {
            let retry = 5;
            while(retry>0) {
                if (fs.existsSync(image)) {
                    inputFileStr +=`file '${path.resolve(image).replace(/\\/g,'/')}'\nduration 15\n`;
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

        const ffmpegCommandToSoundlessMp4 = [
            '-f', 'concat',
            '-safe', '0',
            '-i', inputFile
        ];

        ffmpegCommandToSoundlessMp4.push(...[
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-r', '31',
            '-vf', "zoompan=z='min(zoom+0.0015,1.5)':s=1024x1024:d=450",
            '-f', 'mp4'
        ]);
        
        ffmpegCommandToSoundlessMp4.push(outputSoundlessMp4Path);

        const ffmpegCommandToSoundMp4 = [
            '-i', outputSoundlessMp4Path,
            '-i', audioPath,
            '-c:v', 'copy',
            '-c:a', 'aac',
            outputSoundMp4Path,
        ];

        console.log("inputFileStr:",inputFileStr);
        console.log("inputFile:",inputFile);
        console.log("imagesPaths:",imagesPaths);
        console.log("audioPath:",audioPath);
        console.log("outputSoundlessMp4Path:",outputSoundlessMp4Path);
        console.log("outputSoundMp4Path:",outputSoundMp4Path);
        console.log("ffmpegCommandToSoundlessMp4:",ffmpegCommandToSoundlessMp4);
        console.log("ffmpegCommandToSoundMp4:",ffmpegCommandToSoundMp4);
        console.log("inputFile:",inputFile);

        await this.spawnffmpegAsync(ffmpegCommandToSoundlessMp4);

        if(audioPath) 
            await this.spawnffmpegAsync(ffmpegCommandToSoundMp4);
        
        return audioPath ? outputSoundMp4Path : outputSoundlessMp4Path;
    }   

    private async spawnffmpegAsync(ffmpegCommand:any): Promise<boolean> {
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
                        console.log(`Video created successfully!`);
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