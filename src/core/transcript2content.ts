import { IGPTService } from "./gptservice";
import { IImageFetchService } from "./imagefetchservice";
import { IVideoService } from "./videoservice";
import fs from 'fs';
import path from 'path';

export interface ITranscript2Content {
    toSpeech(): Promise<string | undefined>;
    toImages(): Promise<string[] | undefined>;
    toVideo(): Promise<string | undefined>;
}

export class BasicTranscript2Content implements ITranscript2Content {
    private _gptService: IGPTService;
    private _videoService: IVideoService;
    private _fetchService: IImageFetchService;
    private _transcriptFilePath: string;
    private _prefix: string;
    private _primer:string;
    private _audioPath:string | undefined | null;
    private _videoPath:string | undefined | null;
    private _imagePaths:string[] | undefined;

    constructor(gptService: IGPTService, videoService: IVideoService, fetchService: IImageFetchService, transcriptFilePath: string, prefix: string, primer:string) {
        this._gptService = gptService;
        this._videoService = videoService;
        this._fetchService = fetchService;
        this._transcriptFilePath = transcriptFilePath;
        this._prefix = prefix;
        this._primer = primer;
    }

    async toSpeech(): Promise<string | undefined> {
        if(this._audioPath===null || this._audioPath) return this._audioPath || undefined;

        const transcript = fs.readFileSync(this._transcriptFilePath).toString();
        let inputFile:string | null = path.resolve(`./staging/${this._prefix}-output.mp3`).replace(/\\/g, '/');
        const resp = await this._gptService.singleTextToSpeeh({
            input: transcript,
            model: 'tts-1',
            voice:'fable',
            response_format: 'mp3',
            speed: 1
        });

        if (resp.hasErrors === false) {
            fs.writeFileSync(inputFile, resp.result!);
        }

        this._audioPath = inputFile || null;
        return this._audioPath || undefined;
    }

    async toImages(): Promise<string[] | undefined> {
        if(this._imagePaths) return this._imagePaths;
        
        const transcript = fs.readFileSync(this._transcriptFilePath).toString();
        console.log(transcript);
        const resp = await this._gptService.singleConverse(this._primer, transcript);
        const imagePaths: string[] = [];
        
        if (resp.hasErrors === false) {
            const imagePrompts = resp.result!.split('\n').filter(x => !!x?.length);
            console.log("Image Prompts: ", imagePrompts);

            for (let imagePrompt of imagePrompts) {
                const resp = await this._gptService.createImage({
                    prompt: imagePrompt,
                    model: "dall-e-3",
                    n: 1,
                    quality: "hd",
                    size: "1024x1024"
                });
                if (resp.hasErrors === false)  {
                    imagePaths.push(...(await this._fetchService.fetch(resp.result!.urls, this._prefix)))
                }
            }
        }

        this._imagePaths = imagePaths;
        return this._imagePaths;
    }

    async toVideo():Promise<string | undefined> {
        if(this._videoPath===null || this._videoPath) return this._videoPath || undefined;
        
        const imagePaths = await this.toImages();
        let videoPath = undefined;

        if(imagePaths && imagePaths.length > 0) {
            const audioPath = await this.toSpeech();
            videoPath = await this._videoService.gen(imagePaths, audioPath, this._prefix);
        }

        this._videoPath = videoPath || null;
        return this._videoPath || undefined;
    }

}
