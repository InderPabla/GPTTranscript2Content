import { GPTService, IGPTService } from "./core";
import { program } from 'commander';
import { IImageFetchService, LocalImageFetchSaveService } from "./core/imagefetchservice";
import { TRANSCRIPT_PRIMER_POLICYFOLLOW_MANYIMAGES, TRANSCRIPT_PRIMER_POLICYFOLLOW_LOWIMAGES } from "./core/primerconst";
import { v4 as uuidv4 } from 'uuid';
import { validateMinMax } from "./core/utils";
import { IVideoService, LocalVideoService } from "./core/videoservice";
import { BasicTranscript2Content, ITranscript2Content } from "./core/transcript2content";

interface IOpts {
    transcriptFile?: string;
    ffmpeg?: string;
    toImages?: boolean;
    toSpeech?: boolean;
    toVideo?: boolean;
}

program
    .option('-t, --transcriptFile <transcriptFile>', 'Transcript File')
    .option('-f, --ffmpeg <ffmpeg>', 'FFMPEG.exe path')
    .option('-s, --toSpeech', 'Convert transcript to speech')
    .option('-i, --toImages', 'Convert transcript to images')
    .option('-v, --toVideo', 'Convert transcript to video')

program.parse(process.argv);

(async () => {
    
    console.log("GPTTranscript2Content: Started.");
    const options = program.opts() as IOpts;
    console.log("GPTTranscript2Content: Running with options:", JSON.stringify(options));

    validateMinMax('ffmpeg', 1, 1024, true)(options.ffmpeg);
    validateMinMax('transcriptFile', 1, 1024, true)(options.transcriptFile);

    const prefix =  uuidv4().split('-')[0];
    const gptService: IGPTService = new GPTService();
    const fetchService: IImageFetchService = new LocalImageFetchSaveService();
    const videoService: IVideoService = new LocalVideoService(options.ffmpeg!);
    const contentService: ITranscript2Content = new BasicTranscript2Content(gptService, videoService, fetchService, options.transcriptFile!, prefix, TRANSCRIPT_PRIMER_POLICYFOLLOW_MANYIMAGES);

    if(options.toSpeech || options.toImages || options.toVideo) {
        if(options.toSpeech) {
            console.log("GPTTranscript2Content: To speech");
            await contentService.toSpeech();
        }

        if(options.toImages){
            console.log("GPTTranscript2Content: To image");
            await contentService.toImages();
        }

        if(options.toVideo){
            console.log("GPTTranscript2Content: To video");
            await contentService.toVideo();
        }
    }
    else {
        console.log("GPTTranscript2Content: No action");
    }
    
})();