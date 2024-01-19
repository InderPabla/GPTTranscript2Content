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

    constructor(gptService: IGPTService, videoService: IVideoService, fetchService: IImageFetchService, transcriptFilePath: string, prefix: string, primer:string) {
        this._gptService = gptService;
        this._videoService = videoService;
        this._fetchService = fetchService;
        this._transcriptFilePath = transcriptFilePath;
        this._prefix = prefix;
        this._primer = primer;
    }

    async toSpeech(): Promise<string | undefined> {
        const transcript = fs.readFileSync(this._transcriptFilePath).toString();
        const inputFile = path.resolve(`./staging/${this._prefix}-output.mp3`).replace(/\\/g, '/');
        const resp = await this._gptService.singleTextToSpeeh({
            input: transcript,
            model: 'tts-1',
            voice: 'alloy',
            response_format: 'mp3',
            speed: 1
        });

        if (resp.hasErrors === false) {
            fs.writeFileSync(inputFile, resp.result!);
            return inputFile;
        }

        return undefined;
    }

    async toImages(): Promise<string[] | undefined> {
        const transcript = fs.readFileSync(this._transcriptFilePath).toString();
        console.log(transcript);
        const resp = await this._gptService.singleConverse(this._primer, transcript);

        if (resp.hasErrors === false) {
            const imagePrompts = resp.result!.split('\n').filter(x => !!x?.length);
            console.log("Image Prompts: ", imagePrompts);
            const filePaths: string[] = [];

            for (let imagePrompt of imagePrompts) {

                const resp = await this._gptService.createImage({
                    prompt: imagePrompt,
                    model: "dall-e-3",
                    n: 1,
                    quality: "hd",
                    size: "1024x1024"
                });
                if (resp.hasErrors === false)  {
                    filePaths.push(...(await this._fetchService.fetch(resp.result!.urls, this._prefix)))
                }
            }

            if (filePaths?.length > 0) {
                return filePaths;
            }
        }

        return undefined;
    }

    async toVideo():Promise<string | undefined> {
        const imagePaths = await this.toImages();
        if(!imagePaths) return undefined;
        return this._videoService.gen(imagePaths, this._prefix)
    }

}
