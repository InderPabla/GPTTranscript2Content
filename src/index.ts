import { GPTService, IGPTService } from "./core";
import { program } from 'commander';
import { IImageFetchService, LocalImageFetchSaveService } from "./core/imagefetchservice";
import fs from 'fs';
import { TRANSCRIPT_PRIMER } from "./core/primerconst";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { spawn } from'child_process';

const delay = (time:number) => new Promise(res=>setTimeout(res,time));

function validateNotNullUndefinedOrEmpty(key: string) {
    return (value: any) => {
        if (value === undefined || value === null || !value?.length) throw new Error(`${key} failed ${validateNotNullUndefinedOrEmpty.name}.`);
        return value;
    }
}
function validateMinMax(key: string, min: number, max: number, isMandetory: boolean) {
    return (value: any) => {
        if (isMandetory) (validateNotNullUndefinedOrEmpty(key))(value);
        let length = value?.length || 0;
        if (length < min || length > max) throw new Error(`${key} failed ${validateMinMax.name}.`);
        return value;
    }
}

interface IOpts {
    imagePrompt?: string;
    transcriptFile?: string;
    ffmpeg?: string;
    toSpeech?:boolean;
}

program
    .option('-i, --imagePrompt <imagePrompt>', 'Image Prompt', validateMinMax('imagePrompt', 10, 256, false))
    .option('-t, --transcriptFile <transcriptFile>', 'Transcript File')
    .option('-f, --ffmpeg <ffmpeg>', 'FFMPEG.exe path')
    .option('-s, --toSpeech', 'Convert transcript to speech')

program.parse(process.argv);

(async () => {
    console.log("GPTTranscript2Content: Started.");
    const options = program.opts() as IOpts;
    console.log("GPTTranscript2Content: Running with options:", JSON.stringify(options));

    const gptService: IGPTService = new GPTService();
    const fetchService: IImageFetchService = new LocalImageFetchSaveService();
    
    if(options.toSpeech) {
        validateMinMax('transcriptFile', 1, 1024, true)(options.transcriptFile);
        await _transcript2Speech(options.transcriptFile!, gptService, uuidv4().split('-')[0]);
    }
    else if (options.imagePrompt?.length) {
        await _prompt2Image(options.imagePrompt, gptService, fetchService, uuidv4().split('-')[0]);
    }
    else if (options.transcriptFile?.length) {
        validateMinMax('ffmpeg', 1, 1024, true)(options.ffmpeg);
        validateMinMax('transcriptFile', 1, 4096, true)(options.transcriptFile);
        await _trancript2ImageVideo(options.transcriptFile, gptService, fetchService, options.ffmpeg!);
    }
    else {
        console.log("GPTTranscript2Content: No options, exiting.");
    }
})();

async function _trancript2ImageVideo(transcriptFile: string, gptService: IGPTService, fetchService: IImageFetchService, ffmpegPath:string) {
    const transcript = fs.readFileSync(transcriptFile).toString();
    console.log(transcript);
    const resp = await gptService.singleConverse(TRANSCRIPT_PRIMER, transcript);

    if (resp.hasErrors === false) {
        const prefix = uuidv4().split('-')[0];
        const prompts = resp.result!.split('\n').filter(x => !!x?.length);
        console.log("Image Prompts: ", prompts);
        const filePaths: string[] = [];

        for (let prompt of prompts) {
            const _filePaths = await _prompt2Image(prompt, gptService, fetchService, prefix);
            filePaths.push(..._filePaths);
        }

        if (!!filePaths.length) {

            const inputFile = path.resolve(`./staging/${prefix}-input.txt`).replace(/\\/g,'/');
            const outputFile = path.resolve(`./staging/${prefix}-output.mp4`).replace(/\\/g,'/');
            let inputFileStr = '';
            
            for (const image of filePaths) {
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

            const ffmpegProcess = spawn(ffmpegPath, ffmpegCommand);

            ffmpegProcess.stdout.on('data', (data) => {
                console.log(`FFmpeg stdout: ${data}`);
            });

            ffmpegProcess.stderr.on('data', (data) => {
                console.error(`FFmpeg stderr: ${data}`);
            });

            ffmpegProcess.on('close', (code) => {
                if (code === 0) {
                    console.log(`Video ${inputFile} created successfully!`);
                } else {
                    console.error(`FFmpeg process exited with code ${code}`);
                }
            });

        }
    }
}

async function _prompt2Image(imagePrompt: string, gptService: IGPTService, fetchService: IImageFetchService, prefix: string): Promise<string[]> {
    const resp = await gptService.createImage({
        prompt: imagePrompt,
        model: "dall-e-3",
        n: 1,
        quality: "hd",
        size: "1024x1024"
    });
    if (resp.hasErrors === false) return await fetchService.fetch(resp.result!.urls, prefix);
    return [];
}

async function _transcript2Speech(transcriptFile:string, gptService:IGPTService, prefix: string) {
    const transcript = fs.readFileSync(transcriptFile).toString();
    const inputFile = path.resolve(`./staging/${prefix}-output.mp3`).replace(/\\/g,'/');
    const resp = await gptService.singleTextToSpeeh({
        input: transcript,
        model: 'tts-1',
        voice: 'alloy',
        response_format: 'mp3',
        speed: 1
    });
    if(resp.hasErrors === false) {
        fs.writeFileSync(inputFile, resp.result!);
    }
}